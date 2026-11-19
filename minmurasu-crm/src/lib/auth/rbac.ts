export type UserRole =
  | 'super_admin'
  | 'agency_admin'
  | 'marketing_manager'
  | 'sales_bd'
  | 'team_member'
  | 'client';

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: UserRole;
  clientId: string | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  agency_admin: 'Agency Admin',
  marketing_manager: 'Marketing Manager',
  sales_bd: 'Sales / BD',
  team_member: 'Team Member',
  client: 'Client',
};

export function isAgencyStaffRole(role: UserRole): boolean {
  return role !== 'client';
}

export function canManageSettings(role: UserRole): boolean {
  return role === 'super_admin' || role === 'agency_admin';
}

export function canManageCampaigns(role: UserRole): boolean {
  return role === 'super_admin' || role === 'agency_admin' || role === 'marketing_manager';
}

export function canManageLeads(role: UserRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'agency_admin' ||
    role === 'marketing_manager' ||
    role === 'sales_bd'
  );
}

export function canViewFinancials(role: UserRole): boolean {
  return role === 'super_admin' || role === 'agency_admin' || role === 'client';
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  super_admin: 0,
  agency_admin: 1,
  marketing_manager: 2,
  sales_bd: 3,
  team_member: 4,
  client: 5,
};

export interface MembershipRow {
  organization_id: string;
  role: string;
  client_id: string | null;
  created_at: string;
}

/**
 * Picks which active membership a user acts under when they belong to more than one
 * organization: the highest-privilege known role, then the oldest membership.
 * Rows with an unrecognised role are ignored rather than trusted.
 * Returns null when there is no usable membership.
 */
export function pickMembership<T extends MembershipRow>(memberships: readonly T[] | null | undefined): T | null {
  const known = (memberships ?? []).filter((m): m is T => m.role in ROLE_PRIORITY);
  if (known.length === 0) return null;
  return [...known].sort(
    (a, b) =>
      ROLE_PRIORITY[a.role as UserRole] - ROLE_PRIORITY[b.role as UserRole] ||
      Date.parse(a.created_at) - Date.parse(b.created_at)
  )[0];
}
