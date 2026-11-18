'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChannelMixPoint } from '@/lib/queries/dashboard';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#0082CA', '#F58220', '#25D366', '#6366F1', '#0D2040'];

export function ChannelMixChart({ data }: { data: ChannelMixPoint[] }) {
  const totalEngagements = data.reduce((sum, d) => sum + d.engagements, 0);

  return (
    <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 card-shadow flex flex-col justify-between">
      <div>
        <h2 className="font-display text-base font-bold text-brand-navy dark:text-white">
          Channel Performance
        </h2>
        <p className="text-xs text-brand-slate dark:text-slate-300 mt-0.5">
          Measured engagements by marketing channel
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-52 my-4 flex items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/15 text-xs text-brand-slate dark:text-slate-400">
          No channel data recorded yet.
        </div>
      ) : (
        <>
          <div className="relative h-48 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="engagements"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D2040',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-xl font-extrabold text-brand-navy dark:text-white">
                {formatNumber(totalEngagements)}
              </span>
              <span className="text-[11px] text-brand-slate dark:text-slate-300">Engagements</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {data.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-brand-slate dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-brand-navy dark:text-white">
                  {formatNumber(item.leads)} leads
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
