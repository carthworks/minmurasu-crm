'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageCircle, Send } from 'lucide-react';

export interface ConversationSummary {
  id: string;
  contactName: string;
  phoneNumber: string;
  optIn: boolean;
  status: string;
  lastCustomerMessageAt: string | null;
}

export function WhatsAppInbox({
  apiConfigured,
  conversations,
}: {
  apiConfigured: boolean;
  conversations: ConversationSummary[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const isWithin24h = selected?.lastCustomerMessageAt
    ? Date.now() - new Date(selected.lastCustomerMessageAt).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            WhatsApp Business CRM
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Official WhatsApp Cloud API inbox with 24-hour service window &amp; opt-in enforcement.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${
            apiConfigured
              ? 'border-brand-whatsapp/30 bg-brand-whatsapp/10 text-emerald-700 dark:text-brand-whatsapp'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {apiConfigured ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>WhatsApp Cloud API Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Cloud API Not Configured</span>
            </>
          )}
        </div>
      </div>

      {!apiConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-brand-navy dark:text-slate-200">
          Configure <code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>,{' '}
          <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>, and <code>WHATSAPP_APP_SECRET</code> in{' '}
          <code>.env.local</code> to enable live outbound messaging and webhook sync at{' '}
          <code>/api/webhooks/whatsapp</code>.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden min-h-[480px]">
        {/* Conversations List */}
        <div className="lg:col-span-4 border-r border-slate-100 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/10">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No WhatsApp conversations ingested yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer ${
                  selectedId === conv.id ? 'bg-brand-blue/8' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{conv.contactName}</p>
                  <span className="text-[10px] uppercase font-bold text-brand-whatsapp">
                    {conv.optIn ? 'Opted In' : 'No Opt-In'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{conv.phoneNumber}</p>
              </button>
            ))
          )}
        </div>

        {/* Thread Area */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6">
          {selected ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div>
                  <h2 className="font-display text-base font-bold">{selected.contactName}</h2>
                  <p className="text-xs text-slate-400">{selected.phoneNumber}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-slate dark:text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-brand-orange" />
                  {isWithin24h ? '24h Service Window Open' : 'Template Required (24h Window Closed)'}
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-10">
                Conversation history renders here from <code>conversation_messages</code>.
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex gap-2">
                <input
                  type="text"
                  disabled={!apiConfigured}
                  placeholder={
                    apiConfigured
                      ? isWithin24h
                        ? 'Type a WhatsApp reply...'
                        : 'Select an approved template...'
                      : 'Connect WhatsApp Cloud API to send messages'
                  }
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3.5 py-2 text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!apiConfigured}
                  className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-slate-400 gap-2">
              <MessageCircle className="h-6 w-6 text-brand-whatsapp" />
              <p>Select a conversation or connect your WhatsApp Business webhook to receive enquiries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
