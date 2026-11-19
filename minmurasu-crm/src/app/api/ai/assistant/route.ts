import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserContext } from '@/lib/auth/session';
import { getDashboardData } from '@/lib/queries/dashboard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getAiProviderStatus, pickBestChatModel } from '@/lib/ai/status';

const requestSchema = z.object({
  prompt: z.string().trim().min(2).max(1000),
  clientId: z.string().optional(),
});

async function tryOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ advisory: string; model: string } | null> {
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    return content ? { advisory: content, model } : null;
  } catch {
    return null;
  }
}

async function tryOllama(
  baseUrl: string,
  preferred: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ advisory: string; model: string } | { error: string } | null> {
  try {
    // Check if Ollama is running and discover installed models
    const tagsRes = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!tagsRes.ok) return null;

    const tagsJson = (await tagsRes.json()) as {
      models?: { name: string }[];
    };
    const modelNames = (tagsJson.models ?? []).map((m) => m.name);
    if (modelNames.length === 0) return null;

    const model = pickBestChatModel(modelNames, preferred);

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: true,
        think: false,
        keep_alive: '10m',
        options: { temperature: 0.3, num_predict: 350 },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(180_000),
    });

    if (!chatRes.ok || !chatRes.body) {
      return { error: `Ollama returned HTTP ${chatRes.status} for model "${model}".` };
    }

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed) as { message?: { content?: string } };
          if (chunk.message?.content) {
            content += chunk.message.content;
          }
        } catch {
          // Skip partial JSON line
        }
      }
    }

    return content.trim()
      ? { advisory: content.trim(), model }
      : { error: `Ollama model "${model}" returned an empty response.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Ollama error';
    return { error: `Ollama connection/generation failed: ${msg}` };
  }
}

export async function POST(request: Request) {
  const ctx = await getCurrentUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`ai:${ctx.userId}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
  }

  const data = await getDashboardData({ clientId: parsed.data.clientId });

  const systemPrompt = `You are the MIN MURASU AI Marketing Assistant.
Analyze ONLY the measured performance context provided below (never invent numbers).
Clearly label your output under "AI Recommendations (Advisory)" so it is distinct from measured metrics.
Measured Context:
- Active Clients: ${data.kpis.activeClients}
- Total Leads: ${data.kpis.totalLeads} (Qualified: ${data.kpis.qualifiedLeads})
- Campaign Spend (INR): ${data.kpis.campaignSpendInr}
- Revenue Attributed (INR): ${data.kpis.revenueAttributedInr}
- Average ROI (%): ${data.kpis.avgRoiPct.toFixed(1)}
- Overdue Tasks: ${data.kpis.overdueTasks}
- Campaigns: ${JSON.stringify(data.campaignRows.slice(0, 10))}`;

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const openAiResult = await tryOpenAI(openAiKey, systemPrompt, parsed.data.prompt);
    if (openAiResult) {
      return NextResponse.json({
        advisory: openAiResult.advisory,
        provider: 'openai',
        model: openAiResult.model,
      });
    }
  }

  // Fallback to local Ollama if running
  const aiStatus = await getAiProviderStatus(ctx.organizationId);
  const ollamaResult = await tryOllama(
    aiStatus.ollamaBaseUrl,
    aiStatus.ollamaSelectedModel,
    systemPrompt,
    parsed.data.prompt
  );
  if (ollamaResult && 'advisory' in ollamaResult) {
    return NextResponse.json({
      advisory: ollamaResult.advisory,
      provider: 'ollama',
      model: ollamaResult.model,
    });
  }

  return NextResponse.json(
    {
      error:
        ollamaResult && 'error' in ollamaResult
          ? ollamaResult.error
          : `Neither OPENAI_API_KEY nor a running local Ollama instance (${aiStatus.ollamaBaseUrl} with an installed model) is available.`,
    },
    { status: 503 }
  );
}
