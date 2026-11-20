# Spec: WhatsApp Lead Responder & Qualifier (v1)

| | |
|---|---|
| Status | Draft for review |
| Owner | MIN MURASU |
| Date | 2026-11-20 |
| First playbook | Clinics (Coimbatore / Chennai) |
| Builds on | `/api/webhooks/whatsapp`, `whatsapp_*` and `conversation*` tables, `leads`, `lead_activities`, `notifications`, `/api/ai/assistant` provider code |

---

## 1. Problem and goal

Leads from ads, the website and Google Business Profile wait hours for a reply, and many never get one. Staff retype details between WhatsApp, spreadsheets and the CRM.

**Goal:** every WhatsApp enquiry to a client's number gets a correct, on-brand reply within seconds, 24/7. The agent qualifies the lead, books the next step, logs everything in the CRM and hands over to a person whenever it should.

**v1 success criteria (per client, measured over 30 days after launch):**

| Metric | Target |
|---|---|
| Median time to first reply | < 30 s (baseline: measure for 2 weeks before go-live) |
| Enquiries that complete qualification | ≥ 50% |
| Wrong-answer incidents (staff-flagged) | 0 on pricing / medical / policy topics |
| Handover to staff acknowledged within business hours | < 10 min median |
| Leads created in CRM without manual entry | 100% of inbound WhatsApp enquiries |

These numbers also become the client's case study baseline and results (see the website's `/case-studies` template).

## 2. Scope

### In v1
- Inbound WhatsApp messages on a client's WhatsApp Business number (Cloud API).
- Click-to-WhatsApp ad attribution (`referral` object on the first message).
- FAQ answers grounded only in the client's approved knowledge base.
- A configurable qualification flow (3–5 questions), rule-based lead score, CRM lead creation and stage updates.
- Next-step booking from a configured slot list, or a callback request.
- Human handover (keyword, low confidence, sensitive topic, hot lead) with a staff alert.
- Follow-ups: free-form inside the 24-hour customer service window; approved templates outside it.
- English, Tamil and Tanglish (detect and reply in the customer's language).
- Clinic playbook (section 9).
- CRM screens: playbook config, knowledge base, live inbox takeover, agent log.

### Not in v1
- Website-form and portal leads starting a WhatsApp conversation (business-initiated). Planned for v1.1 because it needs opt-in capture on the form plus an approved template.
- Voice notes and images (v1 replies asking for text; staff see the media in the inbox).
- Two-way sync with hospital or practice management software (bookings go to the CRM and a staff alert).
- Payments, broadcasts, and the other industry playbooks (real estate, RFQ/IndiaMART, education).
- Sending conversions back to Google Ads / Meta (v1 stores the click IDs so v1.1 can).

## 3. Users and roles

| Role (existing `user_role`) | Uses it to |
|---|---|
| `agency_admin`, `marketing_manager` | Set up a client's number, playbook, knowledge base and templates; review agent logs |
| `sales_bd`, `team_member` | Take over conversations, reply, close handovers |
| `client` | See their own conversations and leads, approve knowledge-base answers (read/approve only) |
| End customer | Chats on WhatsApp; never sees the CRM |

All new tables follow the existing RLS model: org-scoped, plus `client_id` scoping for `client` members.

## 4. Conversation flow

```
Customer message
   │
   ▼
Webhook (verify signature, store event, return 200 fast)
   │  after()
   ▼
Router: phone_number_id → client + playbook ── unknown number → log + stop
   │
   ▼
Dedupe on wa_message_id ── already seen → stop
   │
   ▼
Contact + conversation upsert (record opt-in, ad referral, 24h window)
   │
   ▼
Conversation owned by a human? ── yes → notify assignee, no bot reply
   │ no
   ▼
Agent turn
   1. Safety pre-check   (stop words, "talk to a person", emergencies)
   2. Understand          (LLM → intent, language, extracted answers; structured JSON)
   3. Decide (code)       (flow state machine, never the LLM)
        ├─ answer FAQ from knowledge base (cited) or "I'll check with the team"
        ├─ ask next qualification question
        ├─ offer booking slots / confirm booking
        └─ hand over
   4. Compose             (LLM, constrained to the decision + approved facts)
   5. Post-check          (no prices/claims not in KB, length, language)
   │
   ▼
Send via Cloud API → store outbound message → update lead, score, stage, activity log
   │
   ▼
Hot lead or handover → staff alert (CRM notification + WhatsApp template to staff)
```

**The key design rule:** the LLM never decides *what happens next*. A deterministic state machine owns the flow, the LLM only (a) reads the customer's message into structured fields and (b) phrases the reply the state machine chose. This keeps behaviour testable and stops the model from inventing prices, promises or bookings.

### Flow states
`new → greeting → faq_or_qualify → qualifying(q1..qn) → booking → booked | callback_requested → closed`

Any state can move to `human` (handover) or `opted_out`. `human` returns to the bot only when staff click "Hand back to assistant".

### Handover triggers
- Customer asks for a person ("talk to someone", "call me", Tamil equivalents).
- Topic on the playbook's `always_handover` list (clinic: diagnosis, medication, emergencies, complaints, refunds, any price not in the KB).
- Understanding confidence below threshold twice in a row.
- Lead score reaches the playbook's hot threshold.
- LLM or Cloud API failure (customer gets a fixed fallback message, staff get an alert).
- Emergency keywords (clinic): reply with the configured emergency text (e.g. "Please call 108 or visit the nearest emergency department") and alert staff. No other bot replies in that conversation.

## 5. Architecture

### 5.1 Webhook (`src/app/api/webhooks/whatsapp/route.ts`)
Keep the existing signature verification, size limits and event storage. Change:
1. Set `organization_id` on the stored event (resolved from `phone_number_id`); today it is always null.
2. Return `200` immediately, then process inside `after()` (Next.js 16; runs via `waitUntil` on Vercel). Set `export const maxDuration` to cover one agent turn (target p95 < 10 s).
3. Handle `statuses` (delivered/read/failed) by updating `conversation_messages.delivery_status`.
4. Idempotency: unique index on `conversation_messages.wa_message_id`; Meta retries must not trigger a second reply.

If `after()` processing proves unreliable under load, move to a queue (Supabase `pgmq` or a `agent_jobs` table polled by cron). The handler code should call one `processInboundEvent(eventId)` function so the trigger can change without touching the agent.

### 5.2 Modules (new, under `src/lib/agent/`)
| Module | Responsibility |
|---|---|
| `router.ts` | `phone_number_id` → `whatsapp_numbers` row → client, playbook, credentials |
| `ingest.ts` | Parse webhook payload, upsert contact/conversation, store inbound message, capture `referral` (ad id, `ctwa_clid`) |
| `state-machine.ts` | Pure function: `(state, playbook, understanding) → decision`. No I/O. Fully unit-tested. |
| `understand.ts` | LLM call returning validated JSON (zod): `{ intent, language, answers, sensitive, confidence }` |
| `knowledge.ts` | Retrieve approved KB entries for a question (Postgres full-text first; pgvector later if needed) |
| `compose.ts` | LLM call that phrases the decided reply using only supplied facts; template fallback |
| `guard.ts` | Post-check: blocks numbers/prices not present in supplied facts, banned phrases, over-length |
| `whatsapp-client.ts` | Cloud API send (text, interactive buttons/lists, templates), retries, error mapping |
| `followups.ts` | Finds conversations due a follow-up; picks free-form vs template by 24h window |
| `alerts.ts` | CRM `notifications` + staff WhatsApp template |
| `llm.ts` | Provider interface extracted from `/api/ai/assistant` (OpenAI today; provider-agnostic) with timeouts |

Ollama fallback is for local development only; production must use a hosted model with a hard timeout (8 s) and the fixed fallback message.

### 5.3 Scheduler
Follow-ups and window checks need a scheduler. `vercel.json` has none today.
- **Option A (recommended):** Vercel Cron → `GET /api/cron/agent-followups` every 10 minutes, protected by `CRON_SECRET`. Needs a Vercel plan that allows sub-daily crons.
- **Option B:** Supabase `pg_cron` + `pg_net` calling the same route.

### 5.4 Credentials
Each client number has its own access token. Store tokens in **Supabase Vault** (or encrypted at rest with an app key), never in plain `integrations.config` JSON and never returned to the browser. Only server code with the service role reads them.

## 6. Data model (migration `0011_lead_responder.sql`)

New tables (all with `organization_id`, RLS like existing tables, `created_at`/`updated_at`):

```sql
-- One row per WhatsApp Business number the agent serves
whatsapp_numbers (
  id, organization_id, client_id NOT NULL,
  phone_number_id TEXT UNIQUE NOT NULL,     -- Meta id, used for routing
  display_phone TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  token_secret_id UUID,                     -- Vault reference
  playbook_id UUID REFERENCES agent_playbooks(id),
  agent_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  business_hours JSONB NOT NULL,            -- {tz:"Asia/Kolkata", mon:[["09:00","20:00"]], ...}
  staff_alert_numbers TEXT[] NOT NULL DEFAULT '{}'
)

-- Versioned playbook config (questions, scoring, handover rules, copy)
agent_playbooks (
  id, organization_id, client_id,
  kind TEXT NOT NULL,                       -- 'clinic' | 'real_estate' | ...
  version INTEGER NOT NULL,
  config JSONB NOT NULL,                    -- validated by zod schema in code (section 9)
  status TEXT NOT NULL DEFAULT 'draft',     -- draft | active | archived
  approved_by UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ
)

-- Approved facts the agent may use
knowledge_entries (
  id, organization_id, client_id NOT NULL,
  question TEXT NOT NULL, answer TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',     -- draft | approved | retired
  approved_by UUID, approved_at TIMESTAMPTZ,
  search tsvector GENERATED ALWAYS AS (to_tsvector('simple', question || ' ' || answer)) STORED
)

-- Per-conversation agent state
agent_sessions (
  id, organization_id, conversation_id UNIQUE NOT NULL,
  playbook_id, playbook_version INTEGER,
  state TEXT NOT NULL DEFAULT 'new',
  answers JSONB NOT NULL DEFAULT '{}',
  language TEXT,
  low_confidence_count INTEGER NOT NULL DEFAULT 0,
  next_followup_at TIMESTAMPTZ, followups_sent INTEGER NOT NULL DEFAULT 0,
  handed_over_at TIMESTAMPTZ, handover_reason TEXT
)

-- Every agent decision, for review and debugging (no secrets)
agent_turns (
  id, organization_id, session_id, inbound_message_id, outbound_message_id,
  understanding JSONB, decision JSONB, kb_entry_ids UUID[],
  guard_result JSONB, model TEXT, latency_ms INTEGER, error TEXT
)

-- Bookings created by the agent
agent_bookings (
  id, organization_id, client_id, lead_id, conversation_id,
  slot_start TIMESTAMPTZ NOT NULL, slot_label TEXT,
  status TEXT NOT NULL DEFAULT 'requested'  -- requested | confirmed | cancelled | no_show | attended
)
```

Changes to existing tables:
- `conversation_messages`: unique index on `wa_message_id` (where not null); add `sent_by TEXT CHECK (sent_by IN ('customer','agent','staff'))`.
- `conversations`: add `owner TEXT NOT NULL DEFAULT 'agent' CHECK (owner IN ('agent','human'))`, `referral JSONB`.
- `whatsapp_contacts`: add `opted_out_at TIMESTAMPTZ`, `preferred_language TEXT`.
- `leads`: add `source_detail JSONB` (ad id, `ctwa_clid`, UTM) for later conversion upload. Use `source = 'whatsapp_agent'`.
- `whatsapp_webhook_events.organization_id`: start populating it.
- New function `check_contact_rate_limit(...)` (service role only), see section 8.

## 7. Messaging rules (WhatsApp policy)
- Free-form replies only within 24 h of the customer's last message (`conversations.last_customer_message_at`). Outside it, only approved templates (`whatsapp_templates.approval_status = 'approved'`).
- A customer messaging the business first counts as consent to reply to that conversation. Marketing follow-ups beyond the conversation need explicit opt-in, stored in `whatsapp_contacts.opt_in_status/opt_in_at`.
- "STOP", "unsubscribe" and Tamil equivalents set `opted_out_at`; the agent confirms once and never messages again unless the customer writes first.
- Max follow-ups per playbook (default 3: +1 h, +1 day, +3 days), never outside business hours, never after opt-out, booking or handover.
- Use interactive buttons/lists for choices (fewer typing errors, works well for Tamil speakers on mobile).

## 8. Privacy and safety
- **DPDP Act:** show a short notice in the greeting ("We'll use your details to respond to your enquiry. Reply STOP to opt out."), store only fields the playbook needs, and support deletion of a contact's data on request (soft delete + purge job).
- No health details in the qualification flow beyond what booking needs (e.g. "which department", not symptoms). The understanding prompt must not ask follow-up medical questions.
- Prompt-injection resistance: customer text is data. The understand step returns only schema fields; the compose step receives only the decided action and approved facts, not raw instructions from the customer.
- `agent_turns` stores model outputs, not tokens or secrets. Retain 180 days.
- Rate limit per contact (e.g. 20 agent replies/hour) to stop loops and abuse. Reuse the `rate_limits` table, but add a service-role-only function (e.g. `check_contact_rate_limit(p_bucket, p_limit, p_window_seconds)`) in migration 0011: the existing `check_rate_limit` keys on `auth.uid()` and returns `FALSE` for the webhook, which has no signed-in user.

## 9. Clinic playbook (v1)

Validated by a zod schema in `src/lib/agent/playbooks/clinic.ts`. Example config:

```json
{
  "kind": "clinic",
  "greeting": {
    "en": "Hi! Thanks for contacting {clinic_name}. I can answer common questions and help you book a visit. Reply STOP anytime to opt out.",
    "ta": "வணக்கம்! {clinic_name}-ஐ தொடர்பு கொண்டதற்கு நன்றி. ..."
  },
  "questions": [
    { "key": "department", "type": "choice", "options_from": "departments", "required": true },
    { "key": "patient_type", "type": "choice", "options": ["new", "returning"], "required": true },
    { "key": "preferred_day", "type": "choice", "options": ["today", "tomorrow", "this_week", "later"], "required": true },
    { "key": "patient_name", "type": "text", "required": true },
    { "key": "branch", "type": "choice", "options_from": "branches", "required": false }
  ],
  "departments": ["Dermatology", "Dental", "Physiotherapy", "General Medicine"],
  "branches": ["RS Puram", "Saibaba Colony"],
  "scoring": [
    { "if": { "preferred_day": ["today", "tomorrow"] }, "add": 40 },
    { "if": { "patient_type": "new" }, "add": 20 },
    { "if": { "source": "ctwa_ad" }, "add": 15 },
    { "if": { "completed": true }, "add": 25 }
  ],
  "hot_threshold": 70,
  "booking": { "mode": "slots", "slots_source": "manual_weekly", "confirm_by": "staff" },
  "always_handover": ["diagnosis", "medication", "emergency", "complaint", "refund", "price_not_in_kb", "insurance"],
  "emergency_text": { "en": "If this is an emergency, please call 108 or go to the nearest emergency department now." },
  "followups": [{ "after": "1h" }, { "after": "1d" }, { "after": "3d", "template": "clinic_followup_v1" }],
  "compliance": { "no_testimonials": true, "no_outcome_claims": true, "show_doctor_registration": true }
}
```

Clinic-specific rules (NMC guidelines on ethical advertising, October 2026):
- Never promise outcomes ("guaranteed", "100% cure") or quote testimonials; `guard.ts` blocks these phrases.
- Doctor info in replies comes only from approved KB entries and includes qualifications/registration number where the KB has them.
- Bookings are *requested* by the agent and *confirmed* by reception (`confirm_by: "staff"`) in v1.
- Day-before reminder template and a post-visit review request (no incentives, sent to every patient, not only happy ones) are v1.1.

## 10. CRM changes (UI)
| Screen | Change |
|---|---|
| `/whatsapp` inbox | Show who sent each message (customer / agent / staff); "Take over" and "Hand back to assistant" buttons; handover reason badge; send box enabled when the CRM owns the conversation and the 24h window is open, template picker otherwise |
| `/clients/[id]` → WhatsApp tab | Number setup status, agent on/off, business hours, staff alert numbers |
| New `/agent/playbooks/[id]` | Form-based editor for the playbook (no raw JSON for staff), draft → approve → activate, version history |
| New `/agent/knowledge` | KB entries per client with approve/retire; `client` role can approve |
| New `/agent/logs` | `agent_turns` list: message, understanding, decision, KB used, guard result, latency; filter by "handover" and "error" |
| `/leads` | `whatsapp_agent` source filter; answers shown on the lead; link to conversation |
| Dashboard | Time to first reply, qualification rate, handovers, bookings per client |

## 11. Testing
- **State machine:** table-driven unit tests for every state × intent, including opt-out, emergency, low-confidence and window-expired paths.
- **Guard:** cases where the composed reply contains a price, a promise or a testimonial not in the supplied facts must be blocked.
- **Understanding evals:** a fixture set of ≥ 150 real-style messages (English, Tamil, Tanglish, typos, voice-note placeholders, off-topic, injection attempts) with expected JSON; run in CI against the chosen model; block release if intent accuracy < 90% or any sensitive-topic miss.
- **Webhook:** signature, dedupe (same `wa_message_id` twice → one reply), status updates, unknown `phone_number_id`.
- **RLS:** extend `supabase/tests` so a `client` member sees only their own sessions, KB and bookings.
- **End to end:** Meta test number in a staging environment; scripted conversations for each playbook path.

## 12. Rollout
| Milestone | Contents | Exit criteria |
|---|---|---|
| M0: Foundations (week 1) | Migration 0011, number routing, Vault tokens, webhook `after()` + dedupe, outbound send, inbox shows sender and takeover | Staff can reply from the CRM to a test number; no duplicate sends on retried webhooks |
| M1: Agent core (weeks 2–3) | State machine, understand/compose/guard, KB retrieval, handover, alerts, `agent_turns` log | All state-machine tests pass; eval set ≥ 90% intent accuracy |
| M2: Clinic playbook (week 4) | Playbook editor, KB editor, slots, follow-up cron, dashboard metrics | Full scripted clinic conversations pass on staging |
| M3: Pilot (weeks 5–8) | 1–2 founding clinic clients, agent on during business hours first, then 24/7 | Section 1 targets met; client signs off; case study baseline recorded |
| v1.1 | Website-form opt-in start, reminders, review requests, conversion upload to Google Ads / Meta | |

## 13. Commercial packaging (for the website)
- Setup fee (number onboarding, playbook, KB writing, template approvals) plus a monthly fee per WhatsApp number.
- Meta's WhatsApp conversation charges passed through at cost.
- Sold first as an add-on to the SEO / Ads retainers, then standalone.

## 14. Open questions
1. LLM provider and model for production (cost per conversation vs Tamil/Tanglish quality). Run the eval set on 2–3 candidates before M1 ends.
2. Who is the Meta Business "tech provider" for client numbers: MIN MURASU's app with each client's WABA shared to it, or client-owned apps? Affects onboarding and token ownership.
3. Vercel plan: confirm sub-daily cron support, or use `pg_cron` (section 5.3).
4. Booking source of truth for clinics that already use a booking app: keep CRM-only in v1, or read their availability?
5. Tamil script vs Tanglish default for the greeting: decide per client.
6. Data retention period agreed with each client (default 180 days for agent logs, contract length for leads).
