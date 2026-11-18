import { Suspense } from 'react';
import { CreditCard } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils';

async function BillingContent() {
  const invoices = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('invoices')
          .select('id, invoice_number, amount_inr, due_date, status, clients(name)')
          .order('due_date', { ascending: false })
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Billing &amp; Invoices
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Track monthly retainers, invoices, and outstanding balances in INR.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400 flex flex-col items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-blue" />
            <span>No invoices issued yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {invoices.map((inv) => {
                  const cl = inv.clients as unknown as { name: string } | null;
                  return (
                    <tr key={inv.id}>
                      <td className="py-3.5 px-5 font-semibold">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 text-xs">{cl?.name ?? '—'}</td>
                      <td className="py-3.5 px-4 text-xs">{inv.due_date}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-orange/12 text-brand-orange">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold">
                        {formatINR(Number(inv.amount_inr))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading billing...</div>}>
      <BillingContent />
    </Suspense>
  );
}
