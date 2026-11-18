import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ClientsManager } from '@/components/crm/clients-manager';

async function ClientsContent() {
  if (!isSupabaseConfigured()) {
    return <ClientsManager clients={[]} />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('clients')
    .select('id, name, industry, website, location, monthly_retainer_inr, service_package, status')
    .is('deleted_at', null)
    .order('name');

  return <ClientsManager clients={data ?? []} />;
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading clients...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
