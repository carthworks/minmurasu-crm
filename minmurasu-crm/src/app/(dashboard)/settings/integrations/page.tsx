import { Suspense } from 'react';
import Link from 'next/link';
import { Plug } from 'lucide-react';
import { getCurrentUserContext } from '@/lib/auth/session';
import { getAiProviderStatus } from '@/lib/ai/status';

const PROVIDERS = [
  { name: 'WhatsApp Cloud API', envKeys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'] },
  { name: 'Google Analytics 4', envKeys: ['GA4_CLIENT_ID'] },
  { name: 'Google Search Console', envKeys: ['GSC_CLIENT_ID'] },
  { name: 'Google Ads', envKeys: ['GOOGLE_ADS_DEVELOPER_TOKEN'] },
  { name: 'Meta Marketing API', envKeys: ['META_APP_ID'] },
  { name: 'n8n Automation', envKeys: ['N8N_WEBHOOK_URL'] },
];

async function IntegrationsContent() {
  const ctx = await getCurrentUserContext();
  const aiStatus = await getAiProviderStatus(ctx?.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Integrations
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Server-side API connections and webhook endpoints. Secrets are never exposed to the browser.
          </p>
        </div>

        <Link
          href="/settings"
          className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-semibold hover:border-brand-blue transition self-start"
        >
          Edit Ollama Fallback in Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* OpenAI Card */}
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Plug className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold">OpenAI API</h2>
              <p className="text-[11px] text-slate-400">
                {aiStatus.openAiConfigured ? `Model: ${aiStatus.openAiModel}` : 'OPENAI_API_KEY'}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              aiStatus.openAiConfigured
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp'
                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300'
            }`}
          >
            {aiStatus.openAiConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>

        {/* Local Ollama Card */}
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-orange/12 text-brand-orange flex items-center justify-center">
              <Plug className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold">Local Ollama Fallback</h2>
              <p className="text-[11px] text-slate-400">
                {aiStatus.ollamaRunning
                  ? `${aiStatus.ollamaAvailableModels[0]} (${aiStatus.ollamaAvailableModels.length} local)`
                  : aiStatus.ollamaBaseUrl}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              aiStatus.ollamaRunning
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp'
                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300'
            }`}
          >
            {aiStatus.ollamaRunning ? 'Running' : 'Offline'}
          </span>
        </div>

        {PROVIDERS.map((p) => {
          const connected = p.envKeys.every((k) => Boolean(process.env[k]));
          return (
            <div
              key={p.name}
              className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow flex items-start justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Plug className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-bold">{p.name}</h2>
                  <p className="text-[11px] text-slate-400">{p.envKeys.join(', ')}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  connected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300'
                }`}
              >
                {connected ? 'Connected' : 'Not Configured'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading integrations...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
