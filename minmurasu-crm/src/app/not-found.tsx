import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <SearchX className="mx-auto h-10 w-10 text-brand-blue" aria-hidden="true" />
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-brand-navy dark:text-white">
            Page not found
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300">
            The page or record you&apos;re looking for doesn&apos;t exist, or you no longer have
            access to it.
          </p>
        </div>
        <Link
          href="/"
          className="btn-brand-primary inline-flex items-center rounded-xl px-4 py-2 text-xs"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
