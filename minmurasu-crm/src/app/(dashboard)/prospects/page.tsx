import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ProspectsManager } from '@/components/crm/prospects-manager';

async function ProspectsContent() {
  if (!isSupabaseConfigured()) {
    return <ProspectsManager prospects={[]} />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('prospects')
    .select('id, company_name, contact_name, email, phone, industry, estimated_retainer_inr, status')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <ProspectsManager prospects={data ?? []} />;
}

export default function ProspectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading prospects...</div>}>
      <ProspectsContent />
    </Suspense>
  );
}
