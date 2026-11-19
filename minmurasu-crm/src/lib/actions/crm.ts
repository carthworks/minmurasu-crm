'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageLeads, isAgencyStaffRole } from '@/lib/auth/rbac';

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
  const { data, error } = await supabase
    .from('clients')
    .insert({
      organization_id: ctx.organizationId,
      ...clientFields,
      contract_start: clientFields.contract_start || null,
      contract_end: clientFields.contract_end || null,
      account_manager_id: ctx.userId,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  if (primary_contact_name) {
    await supabase.from('client_contacts').insert({
      organization_id: ctx.organizationId,
      client_id: data.id,
      full_name: primary_contact_name,
      email: primary_contact_email || null,
      phone: primary_contact_phone || null,
      whatsapp_number: primary_contact_phone || null,
      is_primary: true,
    });
  }

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'client.created',
    entity_type: 'client',
    entity_id: data.id,
    details: { name: parsed.data.name },
  });

  revalidatePath('/clients');
  revalidatePath('/contacts');
  revalidatePath('/');
  return { success: true, id: data.id };
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

  // Duplicate check by email or phone
  if (parsed.data.email || parsed.data.phone) {
    const orParts = [
      parsed.data.email ? `email.eq.${parsed.data.email}` : null,
      parsed.data.phone ? `phone.eq.${parsed.data.phone}` : null,
    ].filter(Boolean);
    if (orParts.length > 0) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id, name')
        .eq('organization_id', ctx.organizationId)
        .is('deleted_at', null)
        .or(orParts.join(','))
        .limit(1);

      if (existing && existing.length > 0 && formData.get('allow_duplicate') !== 'true') {
        return {
          error: `Possible duplicate lead found (${existing[0].name}). Confirm to create anyway.`,
          duplicate: true,
        };
      }
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      organization_id: ctx.organizationId,
      client_id: parsed.data.client_id || null,
      name: parsed.data.name,
      company: parsed.data.company,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      interested_service: parsed.data.interested_service,
      source: parsed.data.source,
      assigned_to: ctx.userId,
      lead_score: parsed.data.lead_score,
      budget_inr: parsed.data.budget_inr ?? null,
      expected_deal_value_inr: parsed.data.expected_deal_value_inr ?? null,
      stage: parsed.data.stage,
      next_follow_up: parsed.data.next_follow_up || null,
      notes: parsed.data.notes,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  await supabase.from('lead_activities').insert({
    organization_id: ctx.organizationId,
    lead_id: data.id,
    actor_id: ctx.userId,
    activity_type: 'created',
    summary: `Lead created from ${parsed.data.source}`,
  });

  revalidatePath('/leads');
  revalidatePath('/pipeline');
  revalidatePath('/');
  return { success: true, id: data.id };
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

  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ stage })
    .eq('id', leadId)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

  revalidatePath('/contacts');
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { success: true };
}
