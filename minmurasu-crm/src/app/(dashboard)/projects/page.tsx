import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ProjectsManager, type ProjectRow } from '@/components/ops/projects-manager';

async function ProjectsContent() {
  if (!isSupabaseConfigured()) {
    return <ProjectsManager projects={[]} clients={[]} />;
  }

  const supabase = await createClient();
  const [{ data: projectsRaw }, { data: clients }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, status, progress_pct, due_date, clients(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
  ]);

  const projects: ProjectRow[] = (projectsRaw ?? []).map((p) => {
    const cl = p.clients as unknown as { name: string } | null;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      client_name: cl?.name ?? '—',
      status: p.status,
      progress_pct: p.progress_pct,
      due_date: p.due_date,
    };
  });

  return <ProjectsManager projects={projects} clients={clients ?? []} />;
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
