import { cache } from 'react';
import { connection } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import type { UserRole } from '@/lib/auth/rbac';
import { isUuid } from '@/lib/validation';

export interface DashboardKPIs {
  activeClients: number;
  mrrInr: number;
  totalLeads: number;
  qualifiedLeads: number;
  campaignSpendInr: number;
  revenueAttributedInr: number;
  avgRoiPct: number;
  conversionRatePct: number;
  pendingApprovals: number;
  overdueTasks: number;
}

export interface TrendPoint {
  date: string;
  leads: number;
  spend: number;
  revenue: number;
  roiPct: number;
}

export interface ChannelMixPoint {
  name: string;
  engagements: number;
  leads: number;
}

export interface ClientProjectRow {
  id: string;
  clientName: string;
  campaignName: string;
  channelName: string;
  status: string;
  leads: number;
  engagements: number;
  spendInr: number;
  revenueInr: number;
  roiPct: number;
}

export interface ShellData {
  configured: boolean;
  userName: string;
  userRole: UserRole;
  clients: { id: string; name: string }[];
  unreadNotifications: number;
}

export interface DashboardPayload extends ShellData {
  kpis: DashboardKPIs;
  trends: TrendPoint[];
  channelMix: ChannelMixPoint[];
  campaignRows: ClientProjectRow[];
}

const EMPTY_KPIS: DashboardKPIs = {
  activeClients: 0,
  mrrInr: 0,
  totalLeads: 0,
  qualifiedLeads: 0,
  campaignSpendInr: 0,
  revenueAttributedInr: 0,
  avgRoiPct: 0,
  conversionRatePct: 0,
  pendingApprovals: 0,
  overdueTasks: 0,
};

interface DashboardMetricsRow {
  active_clients: number;
  mrr_inr: number;
  total_leads: number;
  qualified_leads: number;
  won_leads: number;
  spend_inr: number;
  revenue_inr: number;
  trends: { date: string; leads: number; spend: number; revenue: number }[];
  by_campaign: {
    campaign_id: string;
    leads: number;
    engagements: number;
    spend: number;
    revenue: number;
  }[];
}

const roi = (revenue: number, spend: number) => (spend > 0 ? ((revenue - spend) / spend) * 100 : 0);

const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/**
 * Data needed by the dashboard shell (sidebar/topbar) on every page: who the user is,
 * the client picker and the unread badge. Deliberately excludes metrics so ordinary
 * page navigations don't pay for the full dashboard aggregation.
 */
export const getShellData = cache(async (): Promise<ShellData> => {
  await connection();

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      userName: 'Agency Admin',
      userRole: 'super_admin',
      clients: [],
      unreadNotifications: 0,
    };
  }

  const ctx = await getCurrentUserContext();
  const supabase = await createClient();

  const [{ data: clients }, unread] = await Promise.all([
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name').limit(500),
    ctx
      ? supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', ctx.userId)
          .eq('is_read', false)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    configured: true,
    userName: ctx?.fullName ?? 'MIN MURASU User',
    userRole: ctx?.role ?? 'team_member',
    clients: clients ?? [],
    unreadNotifications: unread.count ?? 0,
  };
});

export async function getDashboardData(filters?: {
  clientId?: string;
  search?: string;
  /** Inclusive YYYY-MM-DD bounds for campaign metrics. Omit for all time. */
  from?: string;
  to?: string;
}): Promise<DashboardPayload> {
  const shell = await getShellData();

  if (!shell.configured) {
    return { ...shell, kpis: EMPTY_KPIS, trends: [], channelMix: [], campaignRows: [] };
  }

  const supabase = await createClient();
  // Anything other than a real client id (e.g. "all", empty, garbage) means "all clients".
  const clientFilter = isUuid(filters?.clientId) ? filters.clientId : null;
  const from = isIsoDate(filters?.from) ? filters.from : null;
  const to = isIsoDate(filters?.to) ? filters.to : null;

  let campaignsQuery = supabase
    .from('campaigns')
    .select('id, name, status, client_id, clients(name), marketing_channels(name)')
    .is('deleted_at', null)
    .limit(1000);
  if (clientFilter) campaignsQuery = campaignsQuery.eq('client_id', clientFilter);

  let approvalsQuery = supabase
    .from('client_approvals')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (clientFilter) approvalsQuery = approvalsQuery.eq('client_id', clientFilter);

  const todayIso = new Date().toISOString().slice(0, 10);
  let overdueTasksQuery = supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .neq('status', 'completed')
    .lt('due_date', todayIso);
  if (clientFilter) overdueTasksQuery = overdueTasksQuery.eq('client_id', clientFilter);

  const [
    { data: metricsData, error: metricsError },
    { data: campaigns },
    { count: pendingApprovals },
    { count: overdueTasks },
  ] = await Promise.all([
    supabase.rpc('dashboard_metrics', { p_client_id: clientFilter, p_from: from, p_to: to }),
    campaignsQuery,
    approvalsQuery,
    overdueTasksQuery,
  ]);

  let agg = (metricsData as DashboardMetricsRow | null) ?? null;

  if (metricsError || !agg) {
    let fClients = supabase
      .from('clients')
      .select('id, monthly_retainer_inr, status')
      .is('deleted_at', null);
    if (clientFilter) fClients = fClients.eq('id', clientFilter);

    let fLeads = supabase.from('leads').select('id, stage').is('deleted_at', null);
    if (clientFilter) fLeads = fLeads.eq('client_id', clientFilter);

    let fMetrics = supabase
      .from('campaign_metrics')
      .select('campaign_id, metric_date, spend_inr, leads_count, engagements, revenue_attributed_inr')
      .order('metric_date', { ascending: true });
    if (clientFilter) fMetrics = fMetrics.eq('client_id', clientFilter);
    if (from) fMetrics = fMetrics.gte('metric_date', from);
    if (to) fMetrics = fMetrics.lte('metric_date', to);

    const [{ data: clRows }, { data: ldRows }, { data: mRows }] = await Promise.all([
      fClients,
      fLeads,
      fMetrics,
    ]);

    const activeCls = (clRows ?? []).filter((c) => c.status === 'active');
    const mrrInr = activeCls.reduce((s, c) => s + Number(c.monthly_retainer_inr || 0), 0);
    const ldList = ldRows ?? [];
    const qualifiedCount = ldList.filter((l) =>
      ['qualified', 'proposal_sent', 'negotiation', 'won'].includes(l.stage)
    ).length;
    const wonCount = ldList.filter((l) => l.stage === 'won').length;

    const trendMap = new Map<string, { leads: number; spend: number; revenue: number }>();
    const campMap = new Map<string, { leads: number; engagements: number; spend: number; revenue: number }>();
    let spendTotal = 0;
    let revTotal = 0;

    for (const m of mRows ?? []) {
      const s = Number(m.spend_inr || 0);
      const r = Number(m.revenue_attributed_inr || 0);
      const l = Number(m.leads_count || 0);
      const e = Number(m.engagements || 0);
      spendTotal += s;
      revTotal += r;

      const tCur = trendMap.get(m.metric_date) ?? { leads: 0, spend: 0, revenue: 0 };
      tCur.leads += l;
      tCur.spend += s;
      tCur.revenue += r;
      trendMap.set(m.metric_date, tCur);

      const cCur = campMap.get(m.campaign_id) ?? { leads: 0, engagements: 0, spend: 0, revenue: 0 };
      cCur.leads += l;
      cCur.engagements += e;
      cCur.spend += s;
      cCur.revenue += r;
      campMap.set(m.campaign_id, cCur);
    }

    agg = {
      active_clients: activeCls.length,
      mrr_inr: mrrInr,
      total_leads: ldList.length,
      qualified_leads: qualifiedCount,
      won_leads: wonCount,
      spend_inr: spendTotal,
      revenue_inr: revTotal,
      trends: Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v })),
      by_campaign: Array.from(campMap.entries()).map(([campaign_id, v]) => ({ campaign_id, ...v })),
    };
  }

  const spend = Number(agg?.spend_inr ?? 0);
  const revenue = Number(agg?.revenue_inr ?? 0);
  const totalLeads = Number(agg?.total_leads ?? 0);
  const wonLeads = Number(agg?.won_leads ?? 0);

  const trends: TrendPoint[] = (agg?.trends ?? []).map((t) => {
    const s = Number(t.spend);
    const r = Number(t.revenue);
    return { date: t.date, leads: Number(t.leads), spend: s, revenue: r, roiPct: Math.round(roi(r, s)) };
  });

  const byCampaign = new Map((agg?.by_campaign ?? []).map((b) => [b.campaign_id, b]));
  const byChannel = new Map<string, { engagements: number; leads: number }>();
  const searchLower = filters?.search?.toLowerCase() ?? '';

  const campaignRows: ClientProjectRow[] = (campaigns ?? [])
    .map((c) => {
      const m = byCampaign.get(c.id);
      const leads = Number(m?.leads ?? 0);
      const engagements = Number(m?.engagements ?? 0);
      const cSpend = Number(m?.spend ?? 0);
      const cRevenue = Number(m?.revenue ?? 0);
      const clientRel = c.clients as unknown as { name: string } | null;
      const channelRel = c.marketing_channels as unknown as { name: string } | null;
      const channelName = channelRel?.name ?? 'General';

      const ch = byChannel.get(channelName) ?? { engagements: 0, leads: 0 };
      ch.engagements += engagements;
      ch.leads += leads;
      byChannel.set(channelName, ch);

      return {
        id: c.id,
        clientName: clientRel?.name ?? 'Unassigned',
        campaignName: c.name,
        channelName,
        status: c.status,
        leads,
        engagements,
        spendInr: cSpend,
        revenueInr: cRevenue,
        roiPct: Math.round(roi(cRevenue, cSpend)),
      };
    })
    .filter(
      (row) =>
        !searchLower ||
        row.clientName.toLowerCase().includes(searchLower) ||
        row.campaignName.toLowerCase().includes(searchLower) ||
        row.channelName.toLowerCase().includes(searchLower)
    );

  const channelMix: ChannelMixPoint[] = Array.from(byChannel.entries()).map(([name, v]) => ({
    name,
    engagements: v.engagements,
    leads: v.leads,
  }));

  return {
    ...shell,
    kpis: {
      activeClients: Number(agg?.active_clients ?? 0),
      mrrInr: Number(agg?.mrr_inr ?? 0),
      totalLeads,
      qualifiedLeads: Number(agg?.qualified_leads ?? 0),
      campaignSpendInr: spend,
      revenueAttributedInr: revenue,
      avgRoiPct: roi(revenue, spend),
      conversionRatePct: totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0,
      pendingApprovals: pendingApprovals ?? 0,
      overdueTasks: overdueTasks ?? 0,
    },
    trends,
    channelMix,
    campaignRows,
  };
}
