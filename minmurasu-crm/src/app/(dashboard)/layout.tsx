import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getDashboardData } from '@/lib/queries/dashboard';

async function DashboardShellLoader({ children }: { children: React.ReactNode }) {
  const data = await getDashboardData();

  return (
    <DashboardShell
      userRole={data.userRole}
      userName={data.userName}
      clients={data.clients}
      unreadNotifications={data.unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardShellLoader>{children}</DashboardShellLoader>
    </Suspense>
  );
}
