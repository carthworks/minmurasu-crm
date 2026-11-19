import { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowUpRight, Database } from 'lucide-react';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { RoiLeadsChart } from '@/components/dashboard/roi-leads-chart';
import { ChannelMixChart } from '@/components/dashboard/channel-mix-chart';
import { getDashboardData } from '@/lib/queries/dashboard';
import { formatINR, formatNumber } from '@/lib/utils';

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; q?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const data = await getDashboardData({
    clientId: params.clientId,
    search: params.q,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy dark:text-white">
            Executive Dashboard
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Live agency &amp; client growth telemetry for <span className="font-semibold">MIN MURASU</span>.
          </p>
        </div>

        <Link
          href="/campaigns"
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start"
        >
          <span>Manage Campaigns</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {!data.configured && (
        <div className="rounded-2xl border border-brand-orange/40 bg-brand-orange/10 p-4 flex items-start gap-3">
          <Database className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-brand-navy dark:text-white">
              Supabase Connection Pending — Zero Fabricated Data Mode Active
            </p>
            <p className="text-brand-slate dark:text-slate-300">
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
              <code>.env.local</code>, then run <code>supabase/migrations/0001_core_schema.sql</code> and{' '}
              <code>0002_rls_policies.sql</code> to populate live KPIs and enforce Row Level Security.
            </p>
          </div>
        </div>
      )}

      <KpiGrid kpis={data.kpis} />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <RoiLeadsChart data={data.trends} />
        </div>
        <div className="lg:col-span-4">
          <ChannelMixChart data={data.channelMix} />
        </div>
      </section>

      <section className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-brand-navy dark:text-white">
              Client Campaign Performance
            </h2>
            <p className="text-xs text-brand-slate dark:text-slate-300 mt-0.5">
              Measured spend, leads, revenue attributed, and ROI by client campaign
            </p>
          </div>
        </div>

        {data.campaignRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <span>No campaign records found for the active filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-5">Client &amp; Campaign</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Leads</th>
                  <th className="py-3 px-4">Spend</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
                {data.campaignRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-brand-navy dark:text-white">{row.clientName}</p>
                      <p className="text-xs text-brand-slate dark:text-slate-400">{row.campaignName}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-brand-slate dark:text-slate-300">
                      {row.channelName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-blue/10 text-brand-blue capitalize">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{formatNumber(row.leads)}</td>
                    <td className="py-3.5 px-4">{formatINR(row.spendInr)}</td>
                    <td className="py-3.5 px-4 font-semibold">{formatINR(row.revenueInr)}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-emerald-600 dark:text-brand-whatsapp">
                      {row.roiPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; q?: string; from?: string; to?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading Executive Dashboard...</div>}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
