'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  Flag,
  FolderKanban,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  createDeliverableAction,
  updateDeliverableStatusAction,
} from '@/lib/actions/operations';
import { TablePagination } from '@/components/ui/table-pagination';
import { safeHttpUrl } from '@/lib/utils';

export interface DeliverableRow {
  id: string;
  title: string;
  file_url: string | null;
  status: string;
  created_at: string;
  client_id: string;
  client_name: string;
  project_name: string;
}

const STATUS_DOT: Record<string, string> = {
  pending_review: 'bg-brand-orange',
  in_review: 'bg-brand-blue',
  approved: 'bg-emerald-500',
  changes_requested: 'bg-rose-500',
  delivered: 'bg-brand-whatsapp',
};

export function DeliverablesManager({
  deliverables,
  projects,
  canCreate,
}: {
  deliverables: DeliverableRow[];
  projects: { id: string; name: string; client_id: string; client_name: string }[];
  canCreate: boolean;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingCount = deliverables.filter(
    (d) => d.status === 'pending_review' || d.status === 'in_review'
  ).length;
  const approvedCount = deliverables.filter(
    (d) => d.status === 'approved' || d.status === 'delivered'
  ).length;
  const changesCount = deliverables.filter((d) => d.status === 'changes_requested').length;

  const filtered = deliverables.filter((d) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.client_name.toLowerCase().includes(q) ||
      d.project_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const projectId = fd.get('project_id') as string;
    const proj = projects.find((p) => p.id === projectId);
    if (proj) fd.set('client_id', proj.client_id);

    startTransition(async () => {
      const res = await createDeliverableAction(fd);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  function handleStatus(
    id: string,
    status: 'pending_review' | 'in_review' | 'approved' | 'changes_requested' | 'delivered'
  ) {
    startTransition(async () => {
      await updateDeliverableStatusAction(id, status);
    });
  }

  function handleExportCsv() {
    const headers = ['Title', 'Client', 'Project', 'Status', 'Asset URL', 'Created'];
    const rows = filtered.map((d) =>
      [d.title, d.client_name, d.project_name, d.status, d.file_url ?? '', d.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-deliverables.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Deliverables
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Upload campaign assets, landing pages, and creative deliverables for client review.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Deliverable</span>
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Total Deliverables</p>
          <p className="font-display text-2xl font-extrabold mt-1">{deliverables.length}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Pending Review</p>
          <p className="font-display text-2xl font-extrabold mt-1 text-brand-orange">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Approved / Delivered</p>
          <p className="font-display text-2xl font-extrabold mt-1 text-emerald-600 dark:text-brand-whatsapp">
            {approvedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 card-shadow">
          <p className="text-xs text-slate-400">Changes Requested</p>
          <p className="font-display text-2xl font-extrabold mt-1 text-rose-500">{changesCount}</p>
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
            placeholder="Search deliverable, client, project..."
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
          <option value="pending_review">Pending Review</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="delivered">Delivered</option>
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

      {/* Table */}
      <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400 flex flex-col items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-brand-blue" />
            <span>No deliverables found. Click Add Deliverable to upload one.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-slate-400" />
                      Deliverable
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                      Client &amp; Project
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5 text-slate-400" />
                      Status
                    </span>
                  </th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {paginated.map((d) => {
                  const assetUrl = safeHttpUrl(d.file_url);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-brand-navy dark:text-white">{d.title}</p>
                        {assetUrl ? (
                          <a
                            href={assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline mt-0.5"
                          >
                            View Asset
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No external link</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <p className="font-medium">{d.client_name}</p>
                        <p className="text-slate-400">{d.project_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[d.status] ?? 'bg-brand-blue'}`}
                          />
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {d.status !== 'approved' && d.status !== 'delivered' && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatus(d.id, 'approved')}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp px-2.5 py-1 text-xs font-semibold hover:bg-emerald-500/20 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          {d.status !== 'changes_requested' && d.status !== 'delivered' && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleStatus(d.id, 'changes_requested')}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/15 px-2.5 py-1 text-xs font-medium hover:border-rose-400 text-rose-500 cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Revise
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Add Deliverable Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Add Deliverable</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Project *</label>
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-center justify-between gap-2">
                    <span>No projects found. Create a project first.</span>
                    <Link href="/projects" className="font-bold text-brand-orange hover:underline shrink-0">
                      + New Project
                    </Link>
                  </div>
                ) : (
                  <select
                    name="project_id"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.client_name} — {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Deliverable Title *</label>
                <input
                  name="title"
                  required
                  placeholder="e.g., Festive Ad Creative Pack (10 Reels)"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Asset Link (Google Drive / Figma / Loom)
                </label>
                <input
                  name="file_url"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Initial Status</label>
                <select
                  name="status"
                  defaultValue="pending_review"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || projects.length === 0}
                  className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer disabled:opacity-60"
                >
                  {isPending ? 'Saving...' : 'Save Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
