import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageSettings } from '@/lib/auth/rbac';
import { BillingManager, type InvoiceRow } from '@/components/billing/billing-manager';

async function BillingContent() {
  if (!isSupabaseConfigured()) {
    return (
      <BillingManager
        invoices={[]}
        clients={[]}
        activeRetainersInr={0}
        canManage={false}
      />
    );
  }

  const ctx = await getCurrentUserContext();
  const canManage = ctx ? canManageSettings(ctx.role) : false;

  const supabase = await createClient();
  const [{ data: invoicesRaw }, { data: clientsRaw }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, client_id, amount_inr, due_date, status, notes, clients(name)')
      .order('due_date', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name, monthly_retainer_inr, status')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const invoices: InvoiceRow[] = (invoicesRaw ?? []).map((inv) => {
    const cl = inv.clients as unknown as { name: string } | null;
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_id: inv.client_id,
      client_name: cl?.name ?? '—',
      amount_inr: Number(inv.amount_inr || 0),
      due_date: inv.due_date,
      status: inv.status,
      notes: inv.notes,
    };
  });

  const activeRetainersInr = (clientsRaw ?? [])
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + Number(c.monthly_retainer_inr || 0), 0);

  return (
    <BillingManager
      invoices={invoices}
      clients={clientsRaw ?? []}
      activeRetainersInr={activeRetainersInr}
      canManage={canManage}
    />
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading billing &amp; invoices...</div>}>
      <BillingContent />
    </Suspense>
  );
}
