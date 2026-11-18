import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ClientProfileTabs } from '@/components/crm/client-profile-tabs';

async function ClientDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!client) notFound();

  const [
    { data: contacts },
    { data: campaigns },
    { data: leads },
    { data: projects },
    { data: invoices },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from('client_contacts')
      .select('id, full_name, role_title, email, phone')
      .eq('client_id', id)
      .is('deleted_at', null),
    supabase
      .from('campaigns')
      .select('id, name, status, budget_inr')
      .eq('client_id', id)
      .is('deleted_at', null),
    supabase
      .from('leads')
      .select('id, name, stage, source, expected_deal_value_inr')
      .eq('client_id', id)
      .is('deleted_at', null),
    supabase
      .from('projects')
      .select('id, name, status, progress_pct, due_date')
      .eq('client_id', id)
      .is('deleted_at', null),
    supabase
      .from('invoices')
      .select('id, invoice_number, amount_inr, status, due_date')
      .eq('client_id', id),
    supabase
      .from('audit_logs')
      .select('id, action, created_at')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Clients
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            {client.name}
          </h1>
          <p className="text-xs text-brand-slate dark:text-slate-300">
            {client.industry || 'Digital Growth Client'} · {client.location || 'India'}
          </p>
        </div>

        {client.website && (
          <a
            href={client.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-medium text-brand-navy dark:text-white hover:border-brand-blue transition self-start"
          >
            <Globe className="h-3.5 w-3.5 text-brand-blue" />
            Visit Website
          </a>
        )}
      </div>

      <ClientProfileTabs
        client={client}
        contacts={contacts ?? []}
        campaigns={campaigns ?? []}
        leads={leads ?? []}
        projects={projects ?? []}
        invoices={invoices ?? []}
        activities={activities ?? []}
      />
    </div>
  );
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading client profile...</div>}>
      <ClientDetailContent params={params} />
    </Suspense>
  );
}
