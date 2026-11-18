import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/auth/rbac';

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

export interface DashboardPayload {
  configured: boolean;
  userName: string;
  userRole: UserRole;
  clients: { id: string; name: string }[];
  kpis: DashboardKPIs;
  trends: TrendPoint[];
  channelMix: ChannelMixPoint[];
  campaignRows: ClientProjectRow[];
  unreadNotifications: number;
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

export async function getDashboardData(filters?: {
  clientId?: string;
  search?: string;
}): Promise<DashboardPayload> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      userName: 'Agency Admin',
      userRole: 'super_admin',
      clients: [],
      kpis: EMPTY_KPIS,
      trends: [],
      channelMix: [],
      campaignRows: [],
      unreadNotifications: 0,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = user?.email ?? 'MIN MURASU User';
  let userRole: UserRole = 'team_member';

  if (user) {
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('organization_members')
        .select('role')
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
    ]);
    if (profile?.full_name) userName = profile.full_name;
    if (membership?.role) userRole = membership.role as UserRole;
  }

  const clientFilter = filters?.clientId && filters.clientId !== 'all' ? filters.clientId : null;

  let clientsQuery = supabase
    .from('clients')
    .select('id, name, monthly_retainer_inr, status')
    .is('deleted_at', null);
  if (clientFilter) clientsQuery = clientsQuery.eq('id', clientFilter);

  let campaignsQuery = supabase
    .from('campaigns')
    .select('id, name, status, client_id, clients(name), marketing_channels(name)')
    .is('deleted_at', null);
  if (clientFilter) campaignsQuery = campaignsQuery.eq('client_id', clientFilter);

  let metricsQuery = supabase
    .from('campaign_metrics')
    .select('campaign_id, metric_date, spend_inr, leads_count, conversions, engagements, revenue_attributed_inr')
    .order('metric_date', { ascending: true });
  if (clientFilter) metricsQuery = metricsQuery.eq('client_id', clientFilter);

  let leadsQuery = supabase.from('leads').select('id, stage').is('deleted_at', null);
  if (clientFilter) leadsQuery = leadsQuery.eq('client_id', clientFilter);

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
    { data: allClients },
    { data: filteredClients },
    { data: campaigns },
    { data: metrics },
    { data: leads },
    { count: pendingApprovals },
    { count: overdueTasks },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
    clientsQuery,
    campaignsQuery,
    metricsQuery,
    leadsQuery,
    approvalsQuery,
    overdueTasksQuery,
    user
      ? supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false)
      : Promise.resolve({ count: 0 }),
  ]);

  const activeClientsList = (filteredClients ?? []).filter((c) => c.status === 'active');
  const mrrInr = activeClientsList.reduce((sum, c) => sum + Number(c.monthly_retainer_inr || 0), 0);

  const totalLeads = (leads ?? []).length;
  const qualifiedLeads = (leads ?? []).filter((l) =>
    ['qualified', 'proposal_sent', 'negotiation', 'won'].includes(l.stage)
  ).length;
  const wonLeads = (leads ?? []).filter((l) => l.stage === 'won').length;

  const metricsRows = metrics ?? [];
  const campaignSpendInr = metricsRows.reduce((s, m) => s + Number(m.spend_inr || 0), 0);
  const revenueAttributedInr = metricsRows.reduce(
    (s, m) => s + Number(m.revenue_attributed_inr || 0),
    0
  );
  const avgRoiPct =
    campaignSpendInr > 0
      ? ((revenueAttributedInr - campaignSpendInr) / campaignSpendInr) * 100
      : 0;
  const conversionRatePct = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  // Aggregate trends by date
  const byDate = new Map<string, { leads: number; spend: number; revenue: number }>();
  for (const m of metricsRows) {
    const cur = byDate.get(m.metric_date) ?? { leads: 0, spend: 0, revenue: 0 };
    cur.leads += Number(m.leads_count || 0);
    cur.spend += Number(m.spend_inr || 0);
    cur.revenue += Number(m.revenue_attributed_inr || 0);
    byDate.set(m.metric_date, cur);
  }

  const trends: TrendPoint[] = Array.from(byDate.entries()).map(([date, val]) => ({
    date,
    leads: val.leads,
    spend: val.spend,
    revenue: val.revenue,
    roiPct: val.spend > 0 ? Math.round(((val.revenue - val.spend) / val.spend) * 100) : 0,
  }));

  // Aggregate per-campaign & per-channel
  const metricsByCampaign = new Map<
    string,
    { leads: number; engagements: number; spend: number; revenue: number }
  >();
  for (const m of metricsRows) {
    const cur = metricsByCampaign.get(m.campaign_id) ?? {
      leads: 0,
      engagements: 0,
      spend: 0,
      revenue: 0,
    };
    cur.leads += Number(m.leads_count || 0);
    cur.engagements += Number(m.engagements || 0);
    cur.spend += Number(m.spend_inr || 0);
    cur.revenue += Number(m.revenue_attributed_inr || 0);
    metricsByCampaign.set(m.campaign_id, cur);
  }

  const byChannel = new Map<string, { engagements: number; leads: number }>();
  const searchLower = filters?.search?.toLowerCase() ?? '';

  const campaignRows: ClientProjectRow[] = (campaigns ?? [])
    .map((c) => {
      const agg = metricsByCampaign.get(c.id) ?? {
        leads: 0,
        engagements: 0,
        spend: 0,
        revenue: 0,
      };
      const clientRel = c.clients as unknown as { name: string } | null;
      const channelRel = c.marketing_channels as unknown as { name: string } | null;
      const clientName = clientRel?.name ?? 'Unassigned';
      const channelName = channelRel?.name ?? 'General';

      const chCur = byChannel.get(channelName) ?? { engagements: 0, leads: 0 };
      chCur.engagements += agg.engagements;
      chCur.leads += agg.leads;
      byChannel.set(channelName, chCur);

      return {
        id: c.id,
        clientName,
        campaignName: c.name,
        channelName,
        status: c.status,
        leads: agg.leads,
        engagements: agg.engagements,
        spendInr: agg.spend,
        revenueInr: agg.revenue,
        roiPct: agg.spend > 0 ? Math.round(((agg.revenue - agg.spend) / agg.spend) * 100) : 0,
      };
    })
    .filter(
      (row) =>
        !searchLower ||
        row.clientName.toLowerCase().includes(searchLower) ||
        row.campaignName.toLowerCase().includes(searchLower) ||
        row.channelName.toLowerCase().includes(searchLower)
    );

  const channelMix: ChannelMixPoint[] = Array.from(byChannel.entries()).map(([name, val]) => ({
    name,
    engagements: val.engagements,
    leads: val.leads,
  }));

  return {
    configured: true,
    userName,
    userRole,
    clients: allClients ?? [],
    kpis: {
      activeClients: activeClientsList.length,
      mrrInr,
      totalLeads,
      qualifiedLeads,
      campaignSpendInr,
      revenueAttributedInr,
      avgRoiPct,
      conversionRatePct,
      pendingApprovals: pendingApprovals ?? 0,
      overdueTasks: overdueTasks ?? 0,
    },
    trends,
    channelMix,
    campaignRows,
    unreadNotifications: unreadNotifications ?? 0,
  };
}
