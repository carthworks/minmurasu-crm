import { Suspense } from 'react';
import { getDashboardData } from '@/lib/queries/dashboard';
import { ReportsView } from '@/components/analytics/reports-view';

async function ReportsContent({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.clientId ?? 'all';
  const data = await getDashboardData({ clientId: selectedClientId, from: params.from, to: params.to });

  const matchedClient = data.clients.find((c) => c.id === selectedClientId);
  const selectedClientName = matchedClient?.name ?? 'All Active Clients';

  return (
    <ReportsView
      kpis={data.kpis}
      rows={data.campaignRows}
      selectedClientId={selectedClientId}
      selectedClientName={selectedClientName}
    />
  );
}

export default function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; from?: string; to?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Generating report...</div>}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}
