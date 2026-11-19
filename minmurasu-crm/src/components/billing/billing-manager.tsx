'use client';

import { useState, useTransition } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { createInvoiceAction, recordPaymentAction } from '@/lib/actions/operations';
import { generateInvoicePdf } from '@/lib/reports/generate-pdf-report';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatINR } from '@/lib/utils';

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  amount_inr: number;
  due_date: string;
  status: string;
  notes: string | null;
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-400',
  sent: 'bg-brand-blue',
  paid: 'bg-emerald-500',
  overdue: 'bg-rose-500',
  cancelled: 'bg-slate-400',
};

export function BillingManager({
  invoices,
  clients,
  activeRetainersInr,
  canManage,
}: {
  invoices: InvoiceRow[];
  clients: { id: string; name: string; monthly_retainer_inr: number }[];
  activeRetainersInr: number;
  canManage: boolean;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<InvoiceRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount_inr || 0), 0);
  const collected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.amount_inr || 0), 0);
  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + Number(i.amount_inr || 0), 0);

  const filtered = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.client_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleExportCsv() {
    const headers = ['Invoice #', 'Client', 'Due Date', 'Status', 'Amount (INR)'];
    const rows = filtered.map((i) =>
      [i.invoice_number, i.client_name, i.due_date, i.status, i.amount_inr]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCreateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createInvoiceAction(fd);
      if (res?.error) setError(res.error);
      else setCreateOpen(false);
    });
  }

  function handleRecordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await recordPaymentAction(fd);
      if (res?.error) setError(res.error);
      else setPayTarget(null);
    });
  }

  const defaultInvNumber = `MM-INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Billing &amp; Invoices
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Track monthly retainers, client invoices, and recorded payments in INR.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Active Monthly Retainers</p>
          <p className="font-display text-2xl font-extrabold mt-1">{formatINR(activeRetainersInr)}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Total Billed</p>
          <p className="font-display text-2xl font-extrabold mt-1">{formatINR(totalBilled)}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Collected (Paid)</p>
          <p className="font-display text-2xl font-extrabold mt-1 text-emerald-600 dark:text-brand-whatsapp">
            {formatINR(collected)}
          </p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Outstanding Balance</p>
          <p className="font-display text-2xl font-extrabold mt-1 text-brand-orange">
            {formatINR(outstanding)}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice # or client..."
            className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-8 pr-3 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="all">Status: Any</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium hover:border-brand-blue transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          Export CSV
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400 flex flex-col items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-blue" />
            <span>No invoices match your current filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                      Amount
                    </span>
                  </th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {paginated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                    <td className="py-2.5 px-4 font-semibold">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4 text-xs font-medium">{inv.client_name}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-400">{inv.due_date}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[inv.status] ?? 'bg-brand-blue'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {formatINR(Number(inv.amount_inr))}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            generateInvoicePdf({
                              invoiceNumber: inv.invoice_number,
                              clientId: inv.client_id,
                              clientName: inv.client_name,
                              amountInr: Number(inv.amount_inr),
                              dueDate: inv.due_date,
                              status: inv.status,
                              notes: inv.notes,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/15 px-2.5 py-1 text-xs font-medium hover:border-brand-blue cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-brand-blue" />
                          PDF
                        </button>
                        {canManage && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setPayTarget(inv);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp px-2.5 py-1 text-xs font-semibold hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          totalItems={filtered.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create Invoice Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Client Invoice</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Client *</label>
                <select name="client_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatINR(Number(c.monthly_retainer_inr || 0))}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Invoice # *</label>
                  <input name="invoice_number" required defaultValue={defaultInvNumber} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Amount (INR) *</label>
                  <input name="amount_inr" type="number" min="1" required defaultValue="50000" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Date *</label>
                  <input name="due_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select name="status" defaultValue="sent" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description / Notes</label>
                <input name="notes" placeholder="Monthly Digital Growth Retainer" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Record Payment — {payTarget.invoice_number}</h3>
              <button type="button" onClick={() => setPayTarget(null)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <input type="hidden" name="invoice_id" value={payTarget.id} />
              <div>
                <label className="block text-xs font-semibold mb-1">Amount Received (INR)</label>
                <input name="amount_inr" type="number" min="1" required defaultValue={payTarget.amount_inr} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method</label>
                <select name="payment_method" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  <option>Bank Transfer / NEFT</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">UTR / Reference Number</label>
                <input name="reference_number" placeholder="UTR123456789" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setPayTarget(null)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
