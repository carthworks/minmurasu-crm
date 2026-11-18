import { Mail } from 'lucide-react';

export default function EmailMarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Email Marketing
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Automated drip sequences, newsletters, and SMTP campaign tracking.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-10 card-shadow text-center flex flex-col items-center gap-2">
        <Mail className="h-6 w-6 text-brand-blue" />
        <p className="font-display text-sm font-bold">SMTP / Email Service Ready</p>
        <p className="text-xs text-slate-400 max-w-md">
          Configure your SMTP credentials in server environment variables and n8n workflows to dispatch automated client &amp; lead sequences.
        </p>
      </div>
    </div>
  );
}
