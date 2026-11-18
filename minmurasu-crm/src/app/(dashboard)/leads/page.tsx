import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { LeadsManager } from '@/components/crm/leads-manager';

async function LeadsContent() {
  if (!isSupabaseConfigured()) {
    return <LeadsManager leads={[]} clients={[]} />;
  }

  const supabase = await createClient();
  const [{ data: leads }, { data: clients }] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'id, name, company, phone, email, interested_service, source, lead_score, expected_deal_value_inr, stage, next_follow_up'
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
  ]);

  return <LeadsManager leads={leads ?? []} clients={clients ?? []} />;
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
