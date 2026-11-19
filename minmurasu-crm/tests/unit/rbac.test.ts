import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canManageCampaigns,
  canManageLeads,
  canManageSettings,
  canViewFinancials,
  isAgencyStaffRole,
  pickMembership,
  type UserRole,
} from '../../src/lib/auth/rbac.ts';

const m = (organization_id: string, role: string, created_at: string, client_id: string | null = null) => ({
  organization_id,
  role,
  client_id,
  created_at,
});

test('pickMembership: no memberships means no session', () => {
  assert.equal(pickMembership([]), null);
  assert.equal(pickMembership(null), null);
  assert.equal(pickMembership(undefined), null);
});

test('pickMembership: a single membership is used as-is', () => {
  const only = m('org-a', 'sales_bd', '2026-01-01T00:00:00Z');
  assert.equal(pickMembership([only]), only);
});

test('pickMembership: multiple orgs no longer lock the user out; highest privilege wins', () => {
  const picked = pickMembership([
    m('org-client', 'client', '2025-01-01T00:00:00Z', 'client-1'),
    m('org-staff', 'team_member', '2026-01-01T00:00:00Z'),
    m('org-admin', 'agency_admin', '2026-06-01T00:00:00Z'),
  ]);
  assert.equal(picked?.organization_id, 'org-admin');
  assert.equal(picked?.role, 'agency_admin');
});

test('pickMembership: equal roles fall back to the oldest membership, regardless of input order', () => {
  const picked = pickMembership([
    m('org-new', 'marketing_manager', '2026-06-01T00:00:00Z'),
    m('org-old', 'marketing_manager', '2024-06-01T00:00:00Z'),
  ]);
  assert.equal(picked?.organization_id, 'org-old');
});

test('pickMembership: client scoping travels with the chosen membership', () => {
  const picked = pickMembership([m('org-a', 'client', '2026-01-01T00:00:00Z', 'client-42')]);
  assert.equal(picked?.client_id, 'client-42');
});

test('pickMembership: unknown roles are ignored, never treated as privileged', () => {
  assert.equal(pickMembership([m('org-x', 'owner', '2020-01-01T00:00:00Z')]), null);
  const picked = pickMembership([
    m('org-x', 'superuser', '2020-01-01T00:00:00Z'),
    m('org-a', 'client', '2026-01-01T00:00:00Z', 'client-1'),
  ]);
  assert.equal(picked?.organization_id, 'org-a');
});

test('pickMembership: does not mutate its input', () => {
  const input = [
    m('org-b', 'client', '2026-01-01T00:00:00Z', 'c'),
    m('org-a', 'super_admin', '2026-02-01T00:00:00Z'),
  ];
  const snapshot = JSON.stringify(input);
  pickMembership(input);
  assert.equal(JSON.stringify(input), snapshot);
});

test('role helpers match the permission matrix the database enforces (migration 0008)', () => {
  const roles: UserRole[] = ['super_admin', 'agency_admin', 'marketing_manager', 'sales_bd', 'team_member', 'client'];
  const matrix = Object.fromEntries(
    roles.map((r) => [
      r,
      [isAgencyStaffRole(r), canManageSettings(r), canManageCampaigns(r), canManageLeads(r), canViewFinancials(r)],
    ])
  );
  assert.deepEqual(matrix, {
    super_admin:       [true,  true,  true,  true,  true],
    agency_admin:      [true,  true,  true,  true,  true],
    marketing_manager: [true,  false, true,  true,  false],
    sales_bd:          [true,  false, false, true,  false],
    team_member:       [true,  false, false, false, false],
    client:            [false, false, false, false, true],
  });
});
