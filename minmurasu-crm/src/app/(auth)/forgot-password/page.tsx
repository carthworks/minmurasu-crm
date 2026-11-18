'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { MurasuLogo } from '@/components/brand/murasu-logo';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'error', text: 'Enter a valid work email address.' });
      return;
    }

    if (!isSupabaseConfigured()) {
      setFeedback({
        type: 'error',
        text: 'Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({
          type: 'success',
          text: 'Password reset link sent. Check your inbox to continue.',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-brand-grid">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-navy p-8 shadow-xl">
        <div className="mb-6">
          <MurasuLogo size="md" subtitle="minmurasu.digital" />
        </div>

        <h1 className="font-display text-xl font-bold text-brand-navy dark:text-white">Reset your password</h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-1 mb-6">
          Enter your registered email and we will send a secure reset link.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="block w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark/80 pl-10 pr-4 py-2.5 text-sm text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
            />
          </div>

          {feedback && (
            <p
              className={`text-xs font-medium rounded-lg px-3 py-2 border ${
                feedback.type === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand-primary w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Send Reset Link</span>
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
