import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserContext } from '@/lib/auth/session';
import { getDashboardData } from '@/lib/queries/dashboard';
import { checkRateLimit } from '@/lib/security/rate-limit';

const requestSchema = z.object({
  prompt: z.string().trim().min(2).max(1000),
  clientId: z.string().optional(),
});

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'OPENAI_API_KEY is not configured in .env.local. Add it on the server to enable AI insights.',
      },
      { status: 503 }
    );
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: parsed.data.prompt },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to reach OpenAI API' }, { status: 502 });
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return NextResponse.json({
    advisory: json.choices?.[0]?.message?.content ?? 'No response generated.',
  });
}
