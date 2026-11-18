import { Suspense } from 'react';
import { getDashboardData } from '@/lib/queries/dashboard';
import { RoiLeadsChart } from '@/components/dashboard/roi-leads-chart';
import { ChannelMixChart } from '@/components/dashboard/channel-mix-chart';
import { AiAssistantPanel } from '@/components/ai/ai-assistant-panel';

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const data = await getDashboardData({ clientId: params.clientId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Performance Analytics &amp; AI Insights
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Measured campaign telemetry paired with advisory AI optimization.
        </p>
      </div>

      <AiAssistantPanel clientId={params.clientId} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <RoiLeadsChart data={data.trends} />
        </div>
        <div className="lg:col-span-4">
          <ChannelMixChart data={data.channelMix} />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading analytics...</div>}>
      <AnalyticsContent searchParams={searchParams} />
    </Suspense>
  );
}
