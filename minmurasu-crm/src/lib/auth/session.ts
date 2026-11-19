import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { UserContext, UserRole } from '@/lib/auth/rbac';

const ROLE_PRIORITY: Record<UserRole, number> = {
  super_admin: 0,
  agency_admin: 1,
  marketing_manager: 2,
  sales_bd: 3,
  team_member: 4,
  client: 5,
};

/**
 * The signed-in user's profile and active organization membership.
 *
 * Memoized per request with React `cache`, so the layout, page and actions in one
 * request share a single auth + membership lookup.
 *
 * A user can belong to more than one organization. Previously `.maybeSingle()` errored
 * in that case and the user was treated as signed out. Now the membership is chosen
 * deterministically: highest-privilege role first, then the oldest membership.
 */
export const getCurrentUserContext = cache(async (): Promise<UserContext | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: memberships, error }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
    supabase
      .from('organization_members')
      .select('organization_id, role, client_id, created_at')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ]);

  if (error) {
    console.error('[session] membership lookup failed', error.code);
    return null;
  }
  if (!memberships || memberships.length === 0) return null;

  const membership = [...memberships].sort(
    (a, b) =>
      (ROLE_PRIORITY[a.role as UserRole] ?? 99) - (ROLE_PRIORITY[b.role as UserRole] ?? 99)
  )[0];

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? user.email ?? 'User',
    organizationId: membership.organization_id,
    role: membership.role as UserRole,
    clientId: membership.client_id,
  };
});
