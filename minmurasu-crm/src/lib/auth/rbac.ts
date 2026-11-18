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
