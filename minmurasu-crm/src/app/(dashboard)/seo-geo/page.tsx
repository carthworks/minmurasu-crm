import { Suspense } from 'react';
import { Globe, SearchCheck, Sparkles } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function SeoGeoContent() {
  const projects = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('seo_projects')
          .select('id, website_url, gsc_property, ga4_property_id, clients(name)')
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          SEO &amp; GEO Performance
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Search Engine Optimization (GSC / GA4) and Generative Engine Optimization (AI citation tracking).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow space-y-3">
          <div className="flex items-center gap-2.5">
            <SearchCheck className="h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-base font-bold">SEO &amp; Search Console</h2>
          </div>
          <p className="text-xs text-brand-slate dark:text-slate-300">
            Keyword rankings, impressions, clicks, CTR, and average position are synced only from connected Google Search Console &amp; GA4 properties.
          </p>
        </div>

        <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow space-y-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-brand-orange" />
            <h2 className="font-display text-base font-bold">GEO (AI Search Visibility)</h2>
          </div>
          <p className="text-xs text-brand-slate dark:text-slate-300">
            Track brand mentions, citation URLs, and prompt-based visibility across AI search engines using measured audit runs.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow">
        <h2 className="font-display text-base font-bold mb-4">Configured SEO/GEO Properties ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-xs text-slate-400">
            No SEO/GEO properties connected yet. Connect Google Search Console or GA4 in Integrations to begin tracking.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
            {projects.map((p) => {
              const cl = p.clients as unknown as { name: string } | null;
              return (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-brand-blue" />
                    <div>
                      <p className="font-semibold">{cl?.name ?? 'Client'}</p>
                      <p className="text-xs text-slate-400">{p.website_url}</p>
                    </div>
                  </div>
                  <span className="text-xs text-brand-slate dark:text-slate-300">
                    {p.gsc_property ? 'GSC Linked' : 'GSC Pending'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SeoGeoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading SEO &amp; GEO...</div>}>
      <SeoGeoContent />
    </Suspense>
  );
}
