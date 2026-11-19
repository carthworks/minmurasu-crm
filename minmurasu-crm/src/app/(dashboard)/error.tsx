'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-navy-dark p-6 text-center space-y-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-brand-orange" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-brand-navy dark:text-white">
            This page couldn&apos;t load
          </h2>
          <p className="text-sm text-brand-slate dark:text-slate-300">
            Something went wrong on our side. Try again, or go back to the dashboard.
          </p>
          {digest && (
            <p className="text-xs text-brand-slate/80 dark:text-slate-400">
              Reference: <code>{digest}</code>
            </p>
          )}
        </div>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs font-semibold"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
