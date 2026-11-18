import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  Percent,
  Target,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import type { DashboardKPIs } from '@/lib/queries/dashboard';
import { formatINR, formatNumber, formatPercent } from '@/lib/utils';

export function KpiGrid({ kpis }: { kpis: DashboardKPIs }) {
  const cards = [
    {
      label: 'Total Active Clients',
      value: formatNumber(kpis.activeClients),
      icon: Briefcase,
      tone: 'bg-brand-blue/10 text-brand-blue',
    },
    {
      label: 'Monthly Recurring Revenue',
      value: formatINR(kpis.mrrInr),
      icon: IndianRupee,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Leads Generated',
      value: formatNumber(kpis.totalLeads),
      icon: UserPlus,
      tone: 'bg-brand-orange/12 text-brand-orange',
    },
    {
      label: 'Qualified Leads',
      value: formatNumber(kpis.qualifiedLeads),
      icon: Target,
      tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Campaign Spend',
      value: formatINR(kpis.campaignSpendInr),
      icon: Wallet,
      tone: 'bg-slate-500/10 text-brand-slate dark:text-slate-300',
    },
    {
      label: 'Revenue Attributed',
      value: formatINR(kpis.revenueAttributedInr),
      icon: TrendingUp,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Average Campaign ROI',
      value: formatPercent(kpis.avgRoiPct, 0),
      icon: Percent,
      tone: 'bg-brand-orange/12 text-brand-orange',
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(kpis.conversionRatePct, 1),
      icon: CheckCircle2,
      tone: 'bg-brand-blue/10 text-brand-blue',
    },
    {
      label: 'Pending Client Approvals',
      value: formatNumber(kpis.pendingApprovals),
      icon: ClipboardCheck,
      tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Overdue Tasks',
      value: formatNumber(kpis.overdueTasks),
      icon: AlertTriangle,
      tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-slate dark:text-slate-300 truncate">
                {card.label}
              </p>
              <p className="font-display text-2xl font-extrabold text-brand-navy dark:text-white mt-1.5 tracking-tight">
                {card.value}
              </p>
            </div>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${card.tone}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
