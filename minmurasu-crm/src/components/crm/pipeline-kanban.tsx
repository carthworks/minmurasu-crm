'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, List } from 'lucide-react';
import { updateLeadStageAction } from '@/lib/actions/crm';
import { formatINR } from '@/lib/utils';
import type { LeadItem } from '@/components/crm/leads-manager';

const STAGES = [
  { key: 'new', label: 'New', color: 'border-t-brand-blue' },
  { key: 'contacted', label: 'Contacted', color: 'border-t-sky-500' },
  { key: 'qualified', label: 'Qualified', color: 'border-t-indigo-500' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'border-t-amber-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-t-brand-orange' },
  { key: 'won', label: 'Won', color: 'border-t-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'border-t-rose-500' },
] as const;

export function PipelineKanban({ initialLeads }: { initialLeads: LeadItem[] }) {
  const [leads, addOptimisticLead] = useOptimistic(
    initialLeads,
    (state, update: { id: string; stage: string }) =>
      state.map((l) => (l.id === update.id ? { ...l, stage: update.stage } : l))
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(targetStage: string) {
    if (!draggingId) return;
    const movedId = draggingId;
    setDraggingId(null);

    startTransition(async () => {
      addOptimisticLead({ id: movedId, stage: targetStage });
      await updateLeadStageAction(movedId, targetStage);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Sales Pipeline
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Drag and drop leads across stages to update pipeline status and log activity.
          </p>
        </div>

        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-semibold text-brand-navy dark:text-white hover:border-brand-blue transition self-start"
        >
          <List className="h-4 w-4 text-brand-blue" />
          <span>Table View</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.key);
          const totalValue = items.reduce(
            (sum, l) => sum + Number(l.expected_deal_value_inr || 0),
            0
          );

          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.key)}
              className={`rounded-2xl border border-slate-200/80 dark:border-white/10 border-t-4 ${stage.color} bg-slate-50/70 dark:bg-brand-navy-surface p-3 min-h-[420px] flex flex-col`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display text-xs font-bold uppercase tracking-wider text-brand-navy dark:text-white">
                    {stage.label}
                  </h2>
                  <p className="text-[11px] text-slate-400">{formatINR(totalValue)}</p>
                </div>
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white dark:bg-brand-navy text-[11px] font-bold flex items-center justify-center border border-slate-200 dark:border-white/10">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggingId(lead.id)}
                    className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 p-3 card-shadow cursor-grab active:cursor-grabbing hover:border-brand-blue/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-brand-navy dark:text-white leading-snug">
                        {lead.name}
                      </p>
                      <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                    {lead.company && (
                      <p className="text-[11px] text-brand-slate dark:text-slate-400 mt-0.5 truncate">
                        {lead.company}
                      </p>
                    )}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-brand-orange">
                        {lead.expected_deal_value_inr ? formatINR(lead.expected_deal_value_inr) : '—'}
                      </span>
                      <span className="text-slate-400">Score {lead.lead_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
