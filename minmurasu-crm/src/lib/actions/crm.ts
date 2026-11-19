'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageLeads, isAgencyStaffRole } from '@/lib/auth/rbac';
import { toUserError } from '@/lib/errors';
import { isUuid, normalizePhone } from '@/lib/validation';

const clientSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required'),
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  location: z.string().trim().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  monthly_retainer_inr: z.coerce.number().min(0).default(0),
  service_package: z.string().trim().optional(),
  status: z.enum(['active', 'onboarding', 'paused', 'churned']).default('active'),
  internal_notes: z.string().trim().optional(),
  primary_contact_name: z.string().trim().optional(),
  primary_contact_email: z.string().trim().email('Invalid contact email').optional().or(z.literal('')),
  primary_contact_phone: z.string().trim().optional(),
});

const uuidField = (msg = 'Invalid ID') =>
  z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, msg);

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Lead name is required'),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  interested_service: z.string().trim().optional(),
  source: z.string().trim().default('manual'),
  client_id: uuidField().optional().or(z.literal('')),
  lead_score: z.coerce.number().min(0).max(100).default(50),
  budget_inr: z.coerce.number().min(0).optional(),
  expected_deal_value_inr: z.coerce.number().min(0).optional(),
  stage: z
    .enum(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'])
    .default('new'),
  next_follow_up: z.string().optional(),
  notes: z.string().trim().optional(),
});

const prospectSchema = z.object({
  company_name: z.string().trim().min(2, 'Company name is required'),
  contact_name: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  source: z.string().trim().optional(),
  estimated_retainer_inr: z.coerce.number().min(0).optional(),
  status: z.enum(['researching', 'outreach', 'replied', 'qualified', 'archived']).default('researching'),
  notes: z.string().trim().optional(),
});

const contactSchema = z.object({
  client_id: uuidField('Select a valid client'),
  full_name: z.string().trim().min(2, 'Contact name is required'),
  role_title: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  whatsapp_number: z.string().trim().optional(),
  is_primary: z.boolean().default(false),
});

export async function createClientAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized: agency staff access required.' };
  }

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    industry: formData.get('industry') || undefined,
    website: formData.get('website') || undefined,
    location: formData.get('location') || undefined,
    contract_start: formData.get('contract_start') || undefined,
    contract_end: formData.get('contract_end') || undefined,
    monthly_retainer_inr: formData.get('monthly_retainer_inr') || 0,
    service_package: formData.get('service_package') || undefined,
    status: formData.get('status') || 'active',
    internal_notes: formData.get('internal_notes') || undefined,
    primary_contact_name: formData.get('primary_contact_name') || undefined,
    primary_contact_email: formData.get('primary_contact_email') || '',
    primary_contact_phone: formData.get('primary_contact_phone') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid client data.' };
  }

  const {
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    ...clientFields
  } = parsed.data;

  const supabase = await createClient();
  // Client, primary contact and audit entry are written in one transaction (migration 0009).
  const { data: clientId, error } = await supabase.rpc('create_client_with_contact', {
    p_organization_id: ctx.organizationId,
    p_client: {
      ...clientFields,
      contract_start: clientFields.contract_start || null,
      contract_end: clientFields.contract_end || null,
    },
    p_contact: primary_contact_name
      ? {
          full_name: primary_contact_name,
          email: primary_contact_email || null,
          phone: normalizePhone(primary_contact_phone) ?? primary_contact_phone ?? null,
        }
      : null,
  });

  if (error) return { error: toUserError(error, 'createClient') };

  revalidatePath('/clients');
  revalidatePath('/contacts');
  revalidatePath('/');
  return { success: true, id: clientId as string };
}

export async function createLeadAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !canManageLeads(ctx.role)) {
    return { error: 'Unauthorized: lead management permission required.' };
  }

  const parsed = leadSchema.safeParse({
    name: formData.get('name'),
    company: formData.get('company') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || '',
    interested_service: formData.get('interested_service') || undefined,
    source: formData.get('source') || 'manual',
    client_id: formData.get('client_id') || '',
    lead_score: formData.get('lead_score') || 50,
    budget_inr: formData.get('budget_inr') ? Number(formData.get('budget_inr')) : undefined,
    expected_deal_value_inr: formData.get('expected_deal_value_inr')
      ? Number(formData.get('expected_deal_value_inr'))
      : undefined,
    stage: formData.get('stage') || 'new',
    next_follow_up: formData.get('next_follow_up') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid lead data.' };
  }

  const supabase = await createClient();
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
  const phone = normalizePhone(parsed.data.phone) ?? parsed.data.phone ?? null;

  // Duplicate check by email or phone. Separate .eq() filters (not a hand-built .or()
  // string) so user input can never change the filter expression.
  if ((email || phone) && formData.get('allow_duplicate') !== 'true') {
    const findBy = async (column: 'email' | 'phone', value: string) => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name')
        .eq('organization_id', ctx.organizationId)
        .is('deleted_at', null)
        .eq(column, value)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    };

    try {
      const existing = (email && (await findBy('email', email))) || (phone && (await findBy('phone', phone)));
      if (existing) {
        return {
          error: `Possible duplicate lead found (${existing.name}). Confirm to create anyway.`,
          duplicate: true,
        };
      }
    } catch (dupError) {
      return { error: toUserError(dupError as { code?: string; message?: string }, 'leadDuplicateCheck') };
    }
  }

  // Lead and its "created" activity are written in one transaction (migration 0009).
  const { data: leadId, error } = await supabase.rpc('create_lead_with_activity', {
    p_organization_id: ctx.organizationId,
    p_lead: {
      client_id: parsed.data.client_id || null,
      name: parsed.data.name,
      company: parsed.data.company ?? null,
      phone,
      email,
      interested_service: parsed.data.interested_service ?? null,
      source: parsed.data.source,
      lead_score: parsed.data.lead_score,
      budget_inr: parsed.data.budget_inr ?? null,
      expected_deal_value_inr: parsed.data.expected_deal_value_inr ?? null,
      stage: parsed.data.stage,
      next_follow_up: parsed.data.next_follow_up || null,
      notes: parsed.data.notes ?? null,
    },
  });

  if (error) return { error: toUserError(error, 'createLead') };

  revalidatePath('/leads');
  revalidatePath('/pipeline');
  revalidatePath('/');
  return { success: true, id: leadId as string };
}

export async function updateLeadStageAction(leadId: string, stage: string) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !canManageLeads(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const validStages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
  if (!validStages.includes(stage)) {
    return { error: 'Invalid stage' };
  }

  if (!isUuid(leadId)) return { error: 'Invalid lead.' };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('leads')
    .update({ stage })
    .eq('id', leadId)
    .eq('organization_id', ctx.organizationId)
    .select('id');

  if (error) return { error: toUserError(error, 'crm') };
  if (!updated?.length) return { error: 'Lead not found or you no longer have access to it.' };

  await supabase.from('lead_activities').insert({
    organization_id: ctx.organizationId,
    lead_id: leadId,
    actor_id: ctx.userId,
    activity_type: 'stage_changed',
    summary: `Pipeline stage moved to ${stage.replace('_', ' ')}`,
  });

  revalidatePath('/pipeline');
  revalidatePath('/leads');
  revalidatePath('/');
  return { success: true };
}

export async function createProspectAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !canManageLeads(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = prospectSchema.safeParse({
    company_name: formData.get('company_name'),
    contact_name: formData.get('contact_name') || undefined,
    email: formData.get('email') || '',
    phone: formData.get('phone') || undefined,
    industry: formData.get('industry') || undefined,
    source: formData.get('source') || undefined,
    estimated_retainer_inr: formData.get('estimated_retainer_inr')
      ? Number(formData.get('estimated_retainer_inr'))
      : undefined,
    status: formData.get('status') || 'researching',
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid prospect data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('prospects').insert({
    organization_id: ctx.organizationId,
    ...parsed.data,
    email: parsed.data.email || null,
    assigned_to: ctx.userId,
  });

  if (error) return { error: toUserError(error, 'crm') };

  revalidatePath('/prospects');
  return { success: true };
}

export async function createContactAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = contactSchema.safeParse({
    client_id: formData.get('client_id'),
    full_name: formData.get('full_name'),
    role_title: formData.get('role_title') || undefined,
    email: formData.get('email') || '',
    phone: formData.get('phone') || undefined,
    whatsapp_number: formData.get('whatsapp_number') || undefined,
    is_primary: formData.get('is_primary') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid contact data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('client_contacts').insert({
    organization_id: ctx.organizationId,
    ...parsed.data,
    email: parsed.data.email || null,
  });

  if (error) return { error: toUserError(error, 'crm') };

  revalidatePath('/contacts');
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { success: true };
}
