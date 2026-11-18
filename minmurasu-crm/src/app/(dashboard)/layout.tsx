import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getDashboardData } from '@/lib/queries/dashboard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardShell
        userRole={data.userRole}
        userName={data.userName}
        clients={data.clients}
        unreadNotifications={data.unreadNotifications}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}
