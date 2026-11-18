import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CampaignsManager, type CampaignRow } from '@/components/ops/campaigns-manager';

async function CampaignsContent() {
  if (!isSupabaseConfigured()) {
    return <CampaignsManager campaigns={[]} clients={[]} channels={[]} />;
  }

  const supabase = await createClient();
  const [{ data: campaignsRaw }, { data: metricsRaw }, { data: clients }, { data: channels }] =
    await Promise.all([
      supabase
        .from('campaigns')
        .select('id, client_id, name, objective, budget_inr, status, clients(name), marketing_channels(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('campaign_metrics')
        .select('campaign_id, spend_inr, leads_count, revenue_attributed_inr'),
      supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('marketing_channels').select('id, name').order('name'),
    ]);

  const agg = new Map<string, { spend: number; leads: number; revenue: number }>();
  for (const m of metricsRaw ?? []) {
    const cur = agg.get(m.campaign_id) ?? { spend: 0, leads: 0, revenue: 0 };
    cur.spend += Number(m.spend_inr || 0);
    cur.leads += Number(m.leads_count || 0);
    cur.revenue += Number(m.revenue_attributed_inr || 0);
    agg.set(m.campaign_id, cur);
  }

  const campaigns: CampaignRow[] = (campaignsRaw ?? []).map((c) => {
    const m = agg.get(c.id) ?? { spend: 0, leads: 0, revenue: 0 };
    const cl = c.clients as unknown as { name: string } | null;
    const ch = c.marketing_channels as unknown as { name: string } | null;
    return {
      id: c.id,
      client_id: c.client_id,
      client_name: cl?.name ?? '—',
      channel_name: ch?.name ?? 'General',
      name: c.name,
      objective: c.objective,
      budget_inr: Number(c.budget_inr || 0),
      status: c.status,
      spend_inr: m.spend,
      leads: m.leads,
      revenue_inr: m.revenue,
    };
  });

  return (
    <CampaignsManager
      campaigns={campaigns}
      clients={clients ?? []}
      channels={channels ?? []}
    />
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading campaigns...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}
