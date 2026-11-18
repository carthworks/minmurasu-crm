import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { PipelineKanban } from '@/components/crm/pipeline-kanban';

async function PipelineContent() {
  if (!isSupabaseConfigured()) {
    return <PipelineKanban initialLeads={[]} />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('leads')
    .select(
      'id, name, company, phone, email, interested_service, source, lead_score, expected_deal_value_inr, stage, next_follow_up'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <PipelineKanban initialLeads={data ?? []} />;
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading pipeline...</div>}>
      <PipelineContent />
    </Suspense>
  );
}
