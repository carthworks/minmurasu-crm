'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Globe, Loader2, Lock, Mail } from 'lucide-react';
import { MurasuLogo } from '@/components/brand/murasu-logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid work email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const supabaseReady = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFeedback({ type: 'error', text: parsed.error.issues[0]?.message ?? 'Invalid credentials.' });
      return;
    }

    if (!supabaseReady) {
      setFeedback({
        type: 'error',
        text: 'Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setFeedback({ type: 'error', text: error.message });
        return;
      }

      setFeedback({ type: 'success', text: 'Authenticated. Loading MIN MURASU Growth Console...' });
      router.push('/');
      router.refresh();
    } catch {
      setFeedback({ type: 'error', text: 'Unable to reach authentication service. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSSO() {
    setFeedback(null);
    if (!supabaseReady) {
      setFeedback({
        type: 'error',
        text: 'Configure Supabase environment variables before using Google Workspace SSO.',
      });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message });
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle geometric grid & brand ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-brand-grid" />
        <div className="absolute -top-40 left-1/3 w-[680px] h-[340px] rounded-full bg-brand-blue/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[460px] h-[300px] rounded-full bg-brand-orange/10 blur-3xl" />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: MIN MURASU Agency Positioning */}
          <section className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-6">
              <MurasuLogo size="lg" />

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-whatsapp/30 bg-brand-whatsapp/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-brand-whatsapp">
                  <span className="h-2 w-2 rounded-full bg-brand-whatsapp animate-pulse" />
                  Real-Time Campaign &amp; WhatsApp CRM Sync Active
                </div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-navy dark:text-white leading-[1.15]">
                  Turn Digital Attention Into Business Growth.
                </h1>
                <p className="text-sm leading-relaxed text-brand-slate dark:text-slate-300">
                  Sign in to your client growth console to monitor live campaign ROI, qualified lead pipelines, SEO/GEO rankings, and automated WhatsApp conversions.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-brand-navy-surface/80 shadow-lg">
              <img
                src="/brand/min-murasu-banner.png"
                alt="MIN MURASU — The Digital Drum"
                className="w-full h-36 object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-brand-navy-surface/80 backdrop-blur p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">Growth Stack</p>
                <p className="mt-1 font-display text-sm font-bold text-brand-navy dark:text-white">
                  SEO · GEO · Meta &amp; Google Ads
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-brand-navy-surface/80 backdrop-blur p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-orange">Core Promise</p>
                <p className="mt-1 font-display text-sm font-bold text-brand-navy dark:text-white">
                  Zero Fabricated Proof
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Login Card */}
          <section className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-navy/95 backdrop-blur-xl shadow-xl shadow-brand-navy/10 dark:shadow-black/50 p-6 sm:p-8">
              <div className="flex lg:hidden justify-center mb-6">
                <MurasuLogo size="md" subtitle="minmurasu.digital" />
              </div>

              <div className="space-y-1.5 mb-6">
                <h2 className="font-display text-xl font-bold tracking-tight text-brand-navy dark:text-white">
                  Client &amp; Growth Portal
                </h2>
                <p className="text-sm text-brand-slate dark:text-slate-300">
                  Sign in to view your campaigns, leads, and ROI telemetry.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-brand-slate dark:text-slate-300"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      className="block w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark/80 pl-10 pr-4 py-2.5 text-sm text-brand-navy dark:text-white placeholder-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/25 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-brand-slate dark:text-slate-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••••••"
                      className="block w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark/80 pl-10 pr-11 py-2.5 text-sm text-brand-navy dark:text-white placeholder-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/25 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-brand-navy dark:hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label htmlFor="remember" className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-white/20 accent-[#F58220] cursor-pointer"
                    />
                    <span className="text-sm text-brand-slate dark:text-slate-300">Remember me</span>
                  </label>

                  <Link href="/forgot-password" className="text-sm font-semibold text-brand-blue hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {feedback && (
                  <p
                    role="alert"
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
                  disabled={isLoading}
                  className="btn-brand-primary w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Growth Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-slate-200 dark:border-white/10" />
                  <span className="bg-white dark:bg-brand-navy px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 shrink-0">
                    Or continue with
                  </span>
                  <div className="w-full border-t border-slate-200 dark:border-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSSO}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark/60 hover:bg-slate-100 dark:hover:bg-brand-navy-surface px-4 py-2.5 text-sm font-medium text-brand-navy dark:text-white transition cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-brand-blue" />
                  <span>Google Workspace / Client SSO</span>
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-brand-slate dark:text-slate-400">
                <span>Need onboarding help?</span>
                <a
                  href="https://www.minmurasu.digital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-brand-whatsapp hover:underline"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-whatsapp" />
                  WhatsApp Desk
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
