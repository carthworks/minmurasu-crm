import Link from 'next/link';
import { Plug, Settings, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Agency Settings
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Configure MIN MURASU organization preferences, team roles, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/settings/team"
          className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow hover:border-brand-blue transition space-y-2"
        >
          <Users className="h-5 w-5 text-brand-blue" />
          <h2 className="font-display text-sm font-bold">Team &amp; RBAC</h2>
          <p className="text-xs text-slate-400">Manage agency staff and client portal permissions.</p>
        </Link>

        <Link
          href="/settings/integrations"
          className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow hover:border-brand-blue transition space-y-2"
        >
          <Plug className="h-5 w-5 text-brand-orange" />
          <h2 className="font-display text-sm font-bold">Integrations</h2>
          <p className="text-xs text-slate-400">WhatsApp Cloud API, GA4, GSC, Meta, and OpenAI.</p>
        </Link>

        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-2">
          <Settings className="h-5 w-5 text-brand-whatsapp" />
          <h2 className="font-display text-sm font-bold">Brand &amp; Portal</h2>
          <p className="text-xs text-slate-400">MIN MURASU · minmurasu.digital · INR Currency</p>
        </div>
      </div>
    </div>
  );
}
