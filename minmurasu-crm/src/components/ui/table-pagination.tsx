'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TablePagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-brand-navy-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-brand-slate dark:text-slate-300">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalItems}</strong>
        </span>
        <select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-7 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2 text-xs font-medium"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="h-7 px-2 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy inline-flex items-center gap-1 font-medium disabled:opacity-40 hover:border-brand-blue transition cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        <span className="px-2 font-semibold tabular-nums">
          Page {safePage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="h-7 px-2 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy inline-flex items-center gap-1 font-medium disabled:opacity-40 hover:border-brand-blue transition cursor-pointer disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
