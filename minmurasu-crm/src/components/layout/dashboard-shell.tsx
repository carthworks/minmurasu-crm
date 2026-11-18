'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import type { UserRole } from '@/lib/auth/rbac';

interface DashboardShellProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  clients: { id: string; name: string }[];
  unreadNotifications: number;
}

export function DashboardShell({
  children,
  userRole,
  userName,
  clients,
  unreadNotifications,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedClientId = searchParams.get('clientId') ?? 'all';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

  function handleClientChange(clientId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (clientId === 'all') {
      params.delete('clientId');
    } else {
      params.set('clientId', clientId);
    }
    router.push(`?${params.toString()}`);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    const params = new URLSearchParams(searchParams.toString());
    if (!q.trim()) {
      params.delete('q');
    } else {
      params.set('q', q.trim());
    }
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
        userName={userName}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          clients={clients}
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          unreadNotifications={unreadNotifications}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
