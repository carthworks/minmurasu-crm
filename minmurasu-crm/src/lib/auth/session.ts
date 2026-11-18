import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { UserContext, UserRole } from '@/lib/auth/rbac';

export async function getCurrentUserContext(): Promise<UserContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
    supabase
      .from('organization_members')
      .select('organization_id, role, client_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  if (!membership) return null;

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? user.email ?? 'User',
    organizationId: membership.organization_id,
    role: membership.role as UserRole,
    clientId: membership.client_id,
  };
}
