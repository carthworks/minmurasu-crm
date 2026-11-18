import { Suspense } from 'react';
import { getDashboardData } from '@/lib/queries/dashboard';
import { ReportsView } from '@/components/analytics/reports-view';

async function ReportsContent() {
  const data = await getDashboardData();
  return <ReportsView kpis={data.kpis} rows={data.campaignRows} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Generating report...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
