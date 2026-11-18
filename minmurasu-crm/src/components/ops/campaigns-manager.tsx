'use client';

import { useState, useTransition } from 'react';
import { BarChart2, Plus, X } from 'lucide-react';
import { createCampaignAction, recordCampaignMetricAction } from '@/lib/actions/operations';
import { formatINR, formatNumber } from '@/lib/utils';

export interface CampaignRow {
  id: string;
  client_id: string;
  client_name: string;
  channel_name: string;
  name: string;
  objective: string | null;
  budget_inr: number;
  status: string;
  spend_inr: number;
  leads: number;
  revenue_inr: number;
}

export function CampaignsManager({
  campaigns,
  clients,
  channels,
}: {
  campaigns: CampaignRow[];
  clients: { id: string; name: string }[];
  channels: { id: string; name: string }[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [metricTarget, setMetricTarget] = useState<CampaignRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCampaignAction(fd);
      if (res?.error) setError(res.error);
      else setCreateOpen(false);
    });
  }

  function handleLogMetric(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await recordCampaignMetricAction(fd);
      if (res?.error) setError(res.error);
      else setMetricTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Campaigns &amp; ROI
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Track budgets, spend, CPL, ROAS, and attributed revenue across client campaigns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
            No campaigns created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-5">Campaign &amp; Client</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Budget / Spend</th>
                  <th className="py-3 px-4">Leads (CPL)</th>
                  <th className="py-3 px-4">ROI</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
                {campaigns.map((c) => {
                  const roi =
                    c.spend_inr > 0
                      ? Math.round(((c.revenue_inr - c.spend_inr) / c.spend_inr) * 100)
                      : 0;
                  const cpl = c.leads > 0 ? Math.round(c.spend_inr / c.leads) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-brand-navy dark:text-white">{c.name}</p>
                        <p className="text-xs text-brand-slate dark:text-slate-400">{c.client_name}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">{c.channel_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-blue/10 text-brand-blue">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-semibold">{formatINR(c.spend_inr)}</p>
                        <p className="text-slate-400">of {formatINR(c.budget_inr)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-semibold">{formatNumber(c.leads)} leads</p>
                        <p className="text-slate-400">{cpl > 0 ? `${formatINR(cpl)} CPL` : '—'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-brand-whatsapp">
                        {roi}%
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setMetricTarget(c);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/15 px-2.5 py-1 text-xs font-medium hover:border-brand-blue transition cursor-pointer"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-brand-blue" />
                          Log Metrics
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Campaign</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Client *</label>
                <select name="client_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Campaign Name *</label>
                <input name="name" required placeholder="Q4 Meta Lead Funnel" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Channel</label>
                  <select name="channel_id" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                    <option value="">General</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Budget (INR)</label>
                  <input name="budget_inr" type="number" min="0" defaultValue="100000" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Daily Metric Modal */}
      {metricTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Log Metrics — {metricTarget.name}</h3>
              <button type="button" onClick={() => setMetricTarget(null)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogMetric} className="space-y-3">
              <input type="hidden" name="campaign_id" value={metricTarget.id} />
              <input type="hidden" name="client_id" value={metricTarget.client_id} />
              <div>
                <label className="block text-xs font-semibold mb-1">Metric Date *</label>
                <input name="metric_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Spend (INR)</label>
                  <input name="spend_inr" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Revenue Attributed (INR)</label>
                  <input name="revenue_attributed_inr" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Leads</label>
                  <input name="leads_count" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Clicks</label>
                  <input name="clicks" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Engagements</label>
                  <input name="engagements" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setMetricTarget(null)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Save Metrics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
