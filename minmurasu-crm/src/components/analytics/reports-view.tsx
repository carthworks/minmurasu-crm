'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { ClientProjectRow, DashboardKPIs } from '@/lib/queries/dashboard';
import {
  generateClientPdfReport,
  type ReportType,
} from '@/lib/reports/generate-pdf-report';
import { formatINR, formatNumber, formatPercent } from '@/lib/utils';

const REPORT_TYPES: ReportType[] = [
  'Monthly Marketing Report',
  'Campaign Performance & ROI Report',
  'Lead Conversion Report',
  'Revenue & Retainer Report',
];

export function ReportsView({
  kpis,
  rows,
  selectedClientId = 'all',
  selectedClientName = 'All Active Clients',
}: {
  kpis: DashboardKPIs;
  rows: ClientProjectRow[];
  selectedClientId?: string;
  selectedClientName?: string;
}) {
  const [reportType, setReportType] = useState<ReportType>('Monthly Marketing Report');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const shortClientRef =
    selectedClientId === 'all'
      ? 'MM-ALL-CLIENTS'
      : `MM-${selectedClientId.slice(0, 8).toUpperCase()}`;

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      await generateClientPdfReport({
        reportType,
        clientId: selectedClientId,
        clientName: selectedClientName,
        kpis,
        rows,
      });
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleExportCsv() {
    const headers = [
      'Client',
      'Campaign',
      'Channel',
      'Status',
      'Leads',
      'Spend (INR)',
      'Revenue (INR)',
      'ROI (%)',
    ];
    const csvRows = rows.map((r) =>
      [
        r.clientName,
        r.campaignName,
        r.channelName,
        r.status,
        r.leads,
        r.spendInr,
        r.revenueInr,
        r.roiPct,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minmurasu-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Client Reports &amp; Exports
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Presentation-ready PDF reports with MIN MURASU branding, date stamp, and Client ID{' '}
            <code className="font-semibold text-brand-blue">{shortClientRef}</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Report type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="h-9 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 text-xs font-semibold"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="h-9 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 text-xs font-semibold hover:border-brand-blue transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-brand-blue" />
            Export CSV
          </button>

          <button
            type="button"
            disabled={generatingPdf}
            onClick={handleDownloadPdf}
            className="btn-brand-primary h-9 inline-flex items-center gap-1.5 rounded-xl px-4 text-xs cursor-pointer disabled:opacity-60"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>{generatingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
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
          <p className="font-display text-xl font-bold mt-1">
            {formatINR(kpis.revenueAttributedInr)}
          </p>
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

      <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold">{reportType}</h2>
            <p className="text-xs text-slate-400">
              Client: {selectedClientName} · ID: {shortClientRef}
            </p>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No campaign records to report.
          </div>
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
