'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, Plus, X } from 'lucide-react';
import { createTaskAction, updateTaskStatusAction } from '@/lib/actions/operations';

export interface TaskRow {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  project_name: string;
}

const TASK_STAGES = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'client_approval', label: 'Client Approval' },
  { key: 'completed', label: 'Completed' },
] as const;

export function TasksBoard({
  initialTasks,
  projects,
}: {
  initialTasks: TaskRow[];
  projects: { id: string; name: string; client_id: string }[];
}) {
  const [tasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state, update: { id: string; status: string }) =>
      state.map((t) => (t.id === update.id ? { ...t, status: update.status } : t))
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDrop(stage: string) {
    if (!draggingId) return;
    const id = draggingId;
    setDraggingId(null);
    startTransition(async () => {
      addOptimisticTask({ id, status: stage });
      await updateTaskStatusAction(id, stage);
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const projId = fd.get('project_id') as string;
    const proj = projects.find((p) => p.id === projId);
    if (proj) fd.set('client_id', proj.client_id);

    startTransition(async () => {
      const res = await createTaskAction(fd);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Tasks &amp; Deliverables Board
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Drag tasks across the 6-stage agency &amp; client approval workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {TASK_STAGES.map((stage) => {
          const items = tasks.filter((t) => t.status === stage.key);
          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.key)}
              className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface p-3 min-h-[380px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider">
                  {stage.label}
                </h2>
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white dark:bg-brand-navy text-[11px] font-bold flex items-center justify-center border border-slate-200 dark:border-white/10">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {items.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggingId(task.id)}
                    className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 p-3 card-shadow cursor-grab active:cursor-grabbing hover:border-brand-blue/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold leading-snug">{task.title}</p>
                      <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{task.project_name}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-semibold uppercase">
                      <span className="text-brand-orange">{task.priority}</span>
                      <span className="text-slate-400">{task.due_date || 'No due date'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Create Task</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Project *</label>
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-brand-navy dark:text-slate-200 flex items-center justify-between gap-2">
                    <span>No projects found. Create a project first.</span>
                    <Link href="/projects" className="font-bold text-brand-orange hover:underline shrink-0">
                      + New Project
                    </Link>
                  </div>
                ) : (
                  <select name="project_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Task Title *</label>
                <input name="title" required placeholder="Design Meta Carousel Creatives" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Priority</label>
                  <select name="priority" defaultValue="medium" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Date</label>
                  <input name="due_date" type="date" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
