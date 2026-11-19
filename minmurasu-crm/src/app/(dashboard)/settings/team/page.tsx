import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageSettings, type UserRole } from '@/lib/auth/rbac';
import { TeamManager, type TeamMemberRow } from '@/components/settings/team-manager';

async function TeamContent() {
  if (!isSupabaseConfigured()) {
    return <TeamManager initialMembers={[]} clients={[]} canEdit={false} />;
  }

  const ctx = await getCurrentUserContext();
  const canEdit = ctx ? canManageSettings(ctx.role) : false;

  const supabase = await createClient();
  const [{ data: membersRaw }, { data: clients }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('id, role, client_id, is_active, profiles(full_name, email, job_title)')
      .order('created_at', { ascending: true }),
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
  ]);

  const members: TeamMemberRow[] = (membersRaw ?? []).map((m) => {
    const prof = m.profiles as unknown as {
      full_name: string;
      email: string;
      job_title: string | null;
    } | null;
    return {
      id: m.id,
      fullName: prof?.full_name ?? 'User',
      email: prof?.email ?? '—',
      jobTitle: prof?.job_title ?? null,
      role: m.role as UserRole,
      clientId: m.client_id,
      isActive: m.is_active,
    };
  });

  return (
    <TeamManager
      initialMembers={members}
      clients={clients ?? []}
      canEdit={canEdit}
    />
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading team &amp; roles...</div>}>
      <TeamContent />
    </Suspense>
  );
}
