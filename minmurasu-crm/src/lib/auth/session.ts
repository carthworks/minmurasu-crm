import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { pickMembership, type UserContext, type UserRole } from '@/lib/auth/rbac';

/**
 * The signed-in user's profile and active organization membership.
 *
 * Memoized per request with React `cache`, so the layout, page and actions in one
 * request share a single auth + membership lookup.
 *
 * A user can belong to more than one organization. Previously `.maybeSingle()` errored
 * in that case and the user was treated as signed out. Now the membership is chosen
 * deterministically by `pickMembership` (highest-privilege role, then oldest).
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

  const membership = pickMembership(memberships);
  if (!membership) return null;

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? user.email ?? 'User',
    organizationId: membership.organization_id,
    role: membership.role as UserRole,
    clientId: membership.client_id,
  };
});
