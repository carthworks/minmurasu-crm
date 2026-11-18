import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { TasksBoard, type TaskRow } from '@/components/ops/tasks-board';

async function TasksContent() {
  if (!isSupabaseConfigured()) {
    return <TasksBoard initialTasks={[]} projects={[]} />;
  }

  const supabase = await createClient();
  const [{ data: tasksRaw }, { data: projects }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, priority, status, due_date, projects(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, client_id')
      .is('deleted_at', null)
      .order('name'),
  ]);

  const tasks: TaskRow[] = (tasksRaw ?? []).map((t) => {
    const p = t.projects as unknown as { name: string } | null;
    return {
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      project_name: p?.name ?? '—',
    };
  });

  return <TasksBoard initialTasks={tasks} projects={projects ?? []} />;
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}
