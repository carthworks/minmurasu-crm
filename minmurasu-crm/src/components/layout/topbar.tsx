'use client';

import { Bell, Menu, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

interface TopbarProps {
  onOpenSidebar: () => void;
  clients: { id: string; name: string }[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadNotifications?: number;
}

export function Topbar({
  onOpenSidebar,
  clients,
  selectedClientId,
  onClientChange,
  searchQuery,
  onSearchChange,
  unreadNotifications = 0,
}: TopbarProps) {
  return (
    <header className="h-16 bg-white/90 dark:bg-brand-navy/90 backdrop-blur border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clients, campaigns, or deliverables..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-brand-navy-dark/70 pl-10 pr-4 py-2 text-sm text-brand-navy dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-brand-navy-dark focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {clients.length > 1 && (
          <select
            aria-label="Filter by client"
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="hidden sm:block rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy-dark px-3 py-2 text-xs font-medium text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
          >
            <option value="all">All Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy-dark text-slate-500 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white transition"
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
