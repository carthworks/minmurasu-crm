'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/lib/queries/dashboard';

export function RoiLeadsChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 card-shadow">
      <div className="mb-4">
        <h2 className="font-display text-base font-bold text-brand-navy dark:text-white">
          Revenue Attributed vs. Campaign Spend
        </h2>
        <p className="text-xs text-brand-slate dark:text-slate-300 mt-0.5">
          Calculated from measured campaign metric records
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/15 text-xs text-brand-slate dark:text-slate-400">
          No campaign metrics recorded yet for this filter.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0082CA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0082CA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F58220" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F58220" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D2040',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue (INR)"
                stroke="#0082CA"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revGrad)"
              />
              <Area
                type="monotone"
                dataKey="spend"
                name="Spend (INR)"
                stroke="#F58220"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
