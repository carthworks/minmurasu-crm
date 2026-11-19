'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Palette, Plug, ShieldCheck, Users } from 'lucide-react';
import { updateOrganizationAction } from '@/lib/actions/operations';
import { useTheme } from '@/components/theme-provider';

interface SettingsManagerProps {
  organization: {
    name: string;
    domain: string;
  };
  canEdit: boolean;
}

const BRAND_SWATCHES = [
  { name: 'Deep Navy', hex: '#0D2040' },
  { name: 'Electric Orange', hex: '#F58220' },
  { name: 'Process Blue', hex: '#0082CA' },
  { name: 'WhatsApp Green', hex: '#25D366' },
];

export function SettingsManager({ organization, canEdit }: SettingsManagerProps) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(organization.name);
  const [domain, setDomain] = useState(organization.domain);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateOrganizationAction(fd);
      if (res?.error) {
        setFeedback({ type: 'error', text: res.error });
      } else {
        setFeedback({ type: 'success', text: 'Organization settings updated.' });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Agency Settings
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Manage MIN MURASU organization profile, brand theme, team access, and API integrations.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/settings/team"
          className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow hover:border-brand-blue transition space-y-2"
        >
          <div className="h-9 w-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="font-display text-sm font-bold">Team Members &amp; RBAC</h2>
          <p className="text-xs text-slate-400">
            Manage agency staff roles and client-isolated portal permissions.
          </p>
        </Link>

        <Link
          href="/settings/integrations"
          className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow hover:border-brand-blue transition space-y-2"
        >
          <div className="h-9 w-9 rounded-xl bg-brand-orange/12 text-brand-orange flex items-center justify-center">
            <Plug className="h-4 w-4" />
          </div>
          <h2 className="font-display text-sm font-bold">API Integrations</h2>
          <p className="text-xs text-slate-400">
            WhatsApp Cloud API, Google Analytics 4, Search Console, Meta, and OpenAI.
          </p>
        </Link>

        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-2">
          <div className="h-9 w-9 rounded-xl bg-brand-whatsapp/12 text-emerald-600 dark:text-brand-whatsapp flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="font-display text-sm font-bold">Row Level Security</h2>
          <p className="text-xs text-slate-400">
            Supabase PostgreSQL RLS active — client accounts are isolated by <code>client_id</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Organization Profile Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow space-y-4"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
            <img
              src="/brand/min-murasu-logo.png"
              alt="MIN MURASU"
              className="h-10 w-10 rounded-xl bg-white p-1 border border-slate-200 object-contain"
            />
            <div>
              <h2 className="font-display text-base font-bold">Organization Profile</h2>
              <p className="text-xs text-slate-400">Primary agency identity &amp; canonical domain</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Agency Name</label>
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3.5 py-2 text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Canonical Domain</label>
              <input
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={!canEdit}
                placeholder="minmurasu.digital"
                className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3.5 py-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          {feedback && (
            <p
              className={`text-xs font-medium rounded-xl px-3.5 py-2 border flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {feedback.text}
            </p>
          )}

          {canEdit && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="btn-brand-primary rounded-xl px-5 py-2 text-xs cursor-pointer disabled:opacity-60"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>

        {/* Appearance & Brand System */}
        <div className="lg:col-span-5 bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/10">
            <Palette className="h-4 w-4 text-brand-orange" />
            <h2 className="font-display text-base font-bold">Theme &amp; Brand Tokens</h2>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-slate dark:text-slate-300">Workspace Theme</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-slate-200 dark:border-white/15 hover:border-brand-blue'
                }`}
              >
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-slate-200 dark:border-white/15 hover:border-brand-blue'
                }`}
              >
                Dark Mode
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-slate dark:text-slate-300">
              Official Palette (Manrope + Inter)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {BRAND_SWATCHES.map((s) => (
                <div
                  key={s.hex}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 dark:border-white/10 p-2 text-xs"
                >
                  <span
                    className="h-5 w-5 rounded-md shrink-0 border border-black/10"
                    style={{ backgroundColor: s.hex }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
