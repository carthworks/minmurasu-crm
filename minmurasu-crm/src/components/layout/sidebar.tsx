'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Contact,
  CreditCard,
  FileCheck2,
  FileText,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  Plug,
  SearchCheck,
  Settings,
  Share2,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { MurasuLogo } from '@/components/brand/murasu-logo';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, type UserRole } from '@/lib/auth/rbac';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  agencyOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  agencyOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [{ label: 'Executive Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    title: 'CRM',
    agencyOnly: true,
    items: [
      { label: 'Clients', href: '/clients', icon: Briefcase },
      { label: 'Prospects', href: '/prospects', icon: Target },
      { label: 'Leads', href: '/leads', icon: UserPlus },
      { label: 'Sales Pipeline', href: '/pipeline', icon: Kanban },
      { label: 'Contacts', href: '/contacts', icon: Contact },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      { label: 'Campaigns & ROI', href: '/campaigns', icon: Megaphone },
      { label: 'Social Media', href: '/social', icon: Share2 },
      { label: 'Content Calendar', href: '/calendar', icon: CalendarDays },
      { label: 'SEO & GEO', href: '/seo-geo', icon: SearchCheck },
      { label: 'Email Marketing', href: '/email', icon: Mail, agencyOnly: true },
      { label: 'WhatsApp Inbox', href: '/whatsapp', icon: MessageCircle },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare, agencyOnly: true },
      { label: 'Deliverables', href: '/deliverables', icon: FileCheck2 },
      { label: 'Client Approvals', href: '/approvals', icon: FileText },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Reports', href: '/reports', icon: FileText },
      { label: 'Performance Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Revenue Analytics', href: '/revenue', icon: TrendingUp },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Team Members', href: '/settings/team', icon: Users, agencyOnly: true },
      { label: 'Billing & Invoices', href: '/billing', icon: CreditCard },
      { label: 'Integrations', href: '/settings/integrations', icon: Plug, agencyOnly: true },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'How-To Guide', href: '/help', icon: BookOpen },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
  userName: string;
}

export function Sidebar({ open, onClose, userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = userRole === 'client';

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-60 h-screen lg:h-full overflow-hidden bg-white dark:bg-brand-navy border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:shrink-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 dark:border-white/10 shrink-0">
          <Link href="/" onClick={onClose}>
            <MurasuLogo size="sm" subtitle="minmurasu.digital" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-2.5 py-3 space-y-3 overflow-y-auto overscroll-contain flex-1">
          {NAV_SECTIONS.filter((s) => !(isClient && s.agencyOnly)).map((section) => {
            const visibleItems = section.items.filter((item) => !(isClient && item.agencyOnly));
            if (visibleItems.length === 0) return null;

            const hasActiveItem = visibleItems.some((item) => pathname === item.href);
            const isCollapsed = collapsed[section.title] ?? false;

            return (
              <div key={section.title} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400/80 hover:text-brand-navy dark:hover:text-white transition cursor-pointer"
                >
                  <span className={hasActiveItem ? 'text-brand-orange' : undefined}>
                    {section.title}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {!isCollapsed && (
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              'flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition',
                              active
                                ? 'bg-slate-100/90 dark:bg-white/10 text-brand-navy dark:text-white font-semibold shadow-[inset_0_0_0_1px_rgba(13,32,64,0.06)] dark:shadow-none'
                                : 'text-brand-slate dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-navy dark:hover:text-white'
                            )}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  active ? 'text-brand-orange' : 'text-slate-400 dark:text-slate-400'
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {active && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 border-t border-slate-100 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/80 dark:bg-brand-navy-surface">
          <div className="h-9 w-9 rounded-full bg-brand-navy dark:bg-brand-orange flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials || 'MM'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-brand-navy dark:text-white truncate">{userName}</p>
            <p className="text-[11px] text-brand-slate dark:text-slate-400 truncate">
              {ROLE_LABELS[userRole]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
