import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { isAgencyStaffRole } from '@/lib/auth/rbac';
import {
  DeliverablesManager,
  type DeliverableRow,
} from '@/components/ops/deliverables-manager';

async function DeliverablesContent() {
  if (!isSupabaseConfigured()) {
    return <DeliverablesManager deliverables={[]} projects={[]} canCreate={false} />;
  }

  const ctx = await getCurrentUserContext();
  const canCreate = ctx ? isAgencyStaffRole(ctx.role) : false;

  const supabase = await createClient();
  const [{ data: delivRaw }, { data: projRaw }] = await Promise.all([
    supabase
      .from('deliverables')
      .select('id, title, status, file_url, created_at, client_id, clients(name), projects(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, client_id, clients(name)')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const deliverables: DeliverableRow[] = (delivRaw ?? []).map((d) => {
    const cl = d.clients as unknown as { name: string } | null;
    const pr = d.projects as unknown as { name: string } | null;
    return {
      id: d.id,
      title: d.title,
      file_url: d.file_url,
      status: d.status,
      created_at: d.created_at,
      client_id: d.client_id,
      client_name: cl?.name ?? '—',
      project_name: pr?.name ?? '—',
    };
  });

  const projects = (projRaw ?? []).map((p) => {
    const cl = p.clients as unknown as { name: string } | null;
    return {
      id: p.id,
      name: p.name,
      client_id: p.client_id,
      client_name: cl?.name ?? '—',
    };
  });

  return (
    <DeliverablesManager
      deliverables={deliverables}
      projects={projects}
      canCreate={canCreate}
    />
  );
}

export default function DeliverablesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading deliverables...</div>}>
      <DeliverablesContent />
    </Suspense>
  );
}
