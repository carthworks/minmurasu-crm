'use client';

import { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = [
  'Summarize overall client ROI and identify underperforming campaigns.',
  'Draft a monthly executive performance summary from measured metrics.',
  'Suggest optimization actions for lead conversion and overdue deliverables.',
];

export function AiAssistantPanel({ clientId }: { clientId?: string }) {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runPrompt(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, clientId }),
      });
      const json = (await res.json()) as { advisory?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Failed to generate insights.');
      } else {
        setReply(json.advisory ?? '');
      }
    } catch {
      setError('Network error while contacting AI endpoint.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-orange/12 text-brand-orange flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold">MIN MURASU AI Marketing Assistant</h2>
            <p className="text-xs text-slate-400">
              Server-side OpenAI insights grounded in RLS-scoped measured records
            </p>
          </div>
        </div>
        <span className="rounded-full bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 text-[11px] font-semibold">
          Advisory Output
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setPrompt(q);
              runPrompt(q);
            }}
            className="rounded-xl border border-slate-200 dark:border-white/15 px-3 py-1.5 text-xs hover:border-brand-blue transition cursor-pointer text-left"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runPrompt(prompt);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about campaign ROI, lead quality, or optimization..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3.5 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>Analyze</span>
        </button>
      </form>

      {error && (
        <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      {reply && (
        <div className="rounded-xl border border-brand-blue/25 bg-brand-blue/5 p-4 text-xs leading-relaxed whitespace-pre-wrap">
          <p className="font-bold uppercase tracking-wider text-brand-blue mb-2">
            AI Recommendations (Advisory — Distinct from Measured Metrics)
          </p>
          {reply}
        </div>
      )}
    </div>
  );
}
