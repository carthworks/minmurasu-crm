'use client';

import { Download, Printer } from 'lucide-react';
import type { ClientProjectRow, DashboardKPIs } from '@/lib/queries/dashboard';
import { formatINR, formatNumber, formatPercent } from '@/lib/utils';

export function ReportsView({
  kpis,
  rows,
}: {
  kpis: DashboardKPIs;
  rows: ClientProjectRow[];
}) {
  function handleExportCsv() {
    const headers = ['Client', 'Campaign', 'Channel', 'Status', 'Leads', 'Spend (INR)', 'Revenue (INR)', 'ROI (%)'];
    const csvRows = rows.map((r) =>
      [r.clientName, r.campaignName, r.channelName, r.status, r.leads, r.spendInr, r.revenueInr, r.roiPct]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-marketing-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Client Reports &amp; Exports
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Generated strictly from verified database performance records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-4 w-4 text-brand-blue" />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Total Spend</p>
          <p className="font-display text-xl font-bold mt-1">{formatINR(kpis.campaignSpendInr)}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Revenue Attributed</p>
          <p className="font-display text-xl font-bold mt-1">{formatINR(kpis.revenueAttributedInr)}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Avg. Campaign ROI</p>
          <p className="font-display text-xl font-bold mt-1 text-emerald-600 dark:text-brand-whatsapp">
            {formatPercent(kpis.avgRoiPct, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Total Leads</p>
          <p className="font-display text-xl font-bold mt-1">{formatNumber(kpis.totalLeads)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-white/10">
          <h2 className="font-display text-base font-bold">Campaign ROI Breakdown</h2>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No campaign records to report.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Leads</th>
                  <th className="py-3 px-4">Spend</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-5 font-semibold">{r.clientName}</td>
                    <td className="py-3 px-4 text-xs">{r.campaignName}</td>
                    <td className="py-3 px-4 text-xs">{r.channelName}</td>
                    <td className="py-3 px-4">{formatNumber(r.leads)}</td>
                    <td className="py-3 px-4">{formatINR(r.spendInr)}</td>
                    <td className="py-3 px-4 font-semibold">{formatINR(r.revenueInr)}</td>
                    <td className="py-3 px-5 text-right font-bold text-emerald-600 dark:text-brand-whatsapp">
                      {r.roiPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
