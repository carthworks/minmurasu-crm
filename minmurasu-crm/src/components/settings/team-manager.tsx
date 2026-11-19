'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Shield, Users } from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@/lib/auth/rbac';
import { updateMemberRoleAction } from '@/lib/actions/operations';

export interface TeamMemberRow {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  role: UserRole;
  clientId: string | null;
  isActive: boolean;
}

const ALL_ROLES: UserRole[] = [
  'super_admin',
  'agency_admin',
  'marketing_manager',
  'sales_bd',
  'team_member',
  'client',
];

export function TeamManager({
  initialMembers,
  clients,
  canEdit,
}: {
  initialMembers: TeamMemberRow[];
  clients: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(member: TeamMemberRow, patch: Partial<TeamMemberRow>) {
    const next: TeamMemberRow = { ...member, ...patch };
    if (next.role !== 'client') next.clientId = null;
    if (next.role === 'client' && !next.clientId && clients.length > 0) {
      next.clientId = clients[0].id;
    }

    setMembers((prev) => prev.map((m) => (m.id === member.id ? next : m)));
    setFeedback(null);

    startTransition(async () => {
      const res = await updateMemberRoleAction({
        memberId: next.id,
        role: next.role,
        clientId: next.clientId,
        isActive: next.isActive,
      });

      if (res?.error) {
        setFeedback({ type: 'error', text: res.error });
        setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
      } else {
        setFeedback({
          type: 'success',
          text: `Updated ${next.fullName} to ${ROLE_LABELS[next.role]}.`,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Team Members &amp; User Roles
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Assign RBAC roles and client-portal isolation across MIN MURASU users.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 py-1.5 text-xs font-medium text-brand-slate dark:text-slate-300 self-start">
          <Shield className="h-3.5 w-3.5 text-brand-orange" />
          6 RBAC Roles Active
        </span>
      </div>

      {feedback && (
        <div
          className={`text-xs font-medium rounded-xl px-3.5 py-2.5 border flex items-center gap-2 ${
            feedback.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Users className="h-5 w-5 text-brand-blue" />
            <span>No organization members found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  <th className="py-2.5 px-4">Member</th>
                  <th className="py-2.5 px-4">User Role</th>
                  <th className="py-2.5 px-4">Client Scope</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-brand-navy dark:text-white">{m.fullName}</p>
                      <p className="text-[11px] text-slate-400">
                        {m.email} {m.jobTitle ? `· ${m.jobTitle}` : ''}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        aria-label={`Role for ${m.fullName}`}
                        disabled={!canEdit || isPending}
                        value={m.role}
                        onChange={(e) => handleUpdate(m, { role: e.target.value as UserRole })}
                        className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy-dark px-2.5 text-xs font-semibold text-brand-navy dark:text-white disabled:opacity-60"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      {m.role === 'client' ? (
                        <select
                          aria-label={`Client scope for ${m.fullName}`}
                          disabled={!canEdit || isPending}
                          value={m.clientId ?? ''}
                          onChange={(e) => handleUpdate(m, { clientId: e.target.value || null })}
                          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy-dark px-2.5 text-xs font-medium disabled:opacity-60"
                        >
                          <option value="">Select client...</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">All Agency Clients</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={!canEdit || isPending}
                        onClick={() => handleUpdate(m, { isActive: !m.isActive })}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium cursor-pointer disabled:opacity-60"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {m.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
