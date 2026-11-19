'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageCampaigns, isAgencyStaffRole } from '@/lib/auth/rbac';
import { toUserError } from '@/lib/errors';
import { isUuid } from '@/lib/validation';

const uuidField = (msg = 'Invalid ID') =>
  z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, msg);

const campaignSchema = z.object({
  client_id: uuidField('Select a valid client'),
  channel_id: uuidField().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Campaign name is required'),
  objective: z.string().trim().optional(),
  budget_inr: z.coerce.number().min(0).default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'optimization', 'completed']).default('active'),
});

const metricSchema = z.object({
  campaign_id: uuidField('Invalid campaign ID'),
  client_id: uuidField('Invalid client ID'),
  metric_date: z.string().min(8),
  spend_inr: z.coerce.number().min(0).default(0),
  impressions: z.coerce.number().min(0).default(0),
  reach: z.coerce.number().min(0).default(0),
  clicks: z.coerce.number().min(0).default(0),
  engagements: z.coerce.number().min(0).default(0),
  leads_count: z.coerce.number().min(0).default(0),
  conversions: z.coerce.number().min(0).default(0),
  revenue_attributed_inr: z.coerce.number().min(0).default(0),
});

const projectSchema = z.object({
  client_id: uuidField('Select a valid client'),
  name: z.string().trim().min(2, 'Project name is required'),
  description: z.string().trim().optional(),
  due_date: z.string().optional(),
});

const taskSchema = z.object({
  project_id: uuidField('Select a valid project'),
  client_id: uuidField('Select a valid client'),
  title: z.string().trim().min(2, 'Task title is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z
    .enum(['backlog', 'todo', 'in_progress', 'in_review', 'client_approval', 'completed'])
    .default('todo'),
  due_date: z.string().optional(),
});

const socialPostSchema = z.object({
  client_id: uuidField('Select a valid client'),
  title: z.string().trim().min(2, 'Post title is required'),
  caption: z.string().trim().optional(),
  scheduled_at: z.string().optional(),
  publish_status: z.enum(['draft', 'scheduled', 'published']).default('scheduled'),
});

export async function createCampaignAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !canManageCampaigns(ctx.role)) {
    return { error: 'Unauthorized: campaign management permission required.' };
  }

  const parsed = campaignSchema.safeParse({
    client_id: formData.get('client_id'),
    channel_id: formData.get('channel_id') || '',
    name: formData.get('name'),
    objective: formData.get('objective') || undefined,
    budget_inr: formData.get('budget_inr') || 0,
    start_date: formData.get('start_date') || undefined,
    end_date: formData.get('end_date') || undefined,
    status: formData.get('status') || 'active',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid campaign data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('campaigns').insert({
    organization_id: ctx.organizationId,
    client_id: parsed.data.client_id,
    channel_id: parsed.data.channel_id || null,
    name: parsed.data.name,
    objective: parsed.data.objective,
    budget_inr: parsed.data.budget_inr,
    start_date: parsed.data.start_date || null,
    end_date: parsed.data.end_date || null,
    status: parsed.data.status,
    owner_id: ctx.userId,
  });

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/campaigns');
  revalidatePath('/');
  return { success: true };
}

export async function recordCampaignMetricAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !canManageCampaigns(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = metricSchema.safeParse({
    campaign_id: formData.get('campaign_id'),
    client_id: formData.get('client_id'),
    metric_date: formData.get('metric_date'),
    spend_inr: formData.get('spend_inr') || 0,
    impressions: formData.get('impressions') || 0,
    reach: formData.get('reach') || 0,
    clicks: formData.get('clicks') || 0,
    engagements: formData.get('engagements') || 0,
    leads_count: formData.get('leads_count') || 0,
    conversions: formData.get('conversions') || 0,
    revenue_attributed_inr: formData.get('revenue_attributed_inr') || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid metric data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('campaign_metrics').upsert(
    {
      organization_id: ctx.organizationId,
      ...parsed.data,
    },
    { onConflict: 'campaign_id,metric_date' }
  );

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/campaigns');
  revalidatePath('/');
  return { success: true };
}

export async function createProjectAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = projectSchema.safeParse({
    client_id: formData.get('client_id'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    due_date: formData.get('due_date') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid project data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('projects').insert({
    organization_id: ctx.organizationId,
    client_id: parsed.data.client_id,
    name: parsed.data.name,
    description: parsed.data.description,
    due_date: parsed.data.due_date || null,
    owner_id: ctx.userId,
  });

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/projects');
  return { success: true };
}

export async function createTaskAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = taskSchema.safeParse({
    project_id: formData.get('project_id'),
    client_id: formData.get('client_id'),
    title: formData.get('title'),
    priority: formData.get('priority') || 'medium',
    status: formData.get('status') || 'todo',
    due_date: formData.get('due_date') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid task data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tasks').insert({
    organization_id: ctx.organizationId,
    project_id: parsed.data.project_id,
    client_id: parsed.data.client_id,
    title: parsed.data.title,
    priority: parsed.data.priority,
    status: parsed.data.status,
    due_date: parsed.data.due_date || null,
    assignee_id: ctx.userId,
  });

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  if (!isUuid(taskId)) return { error: 'Invalid task.' };
  if (!taskSchema.shape.status.safeParse(status).success) return { error: 'Invalid status.' };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId)
    .select('id');

  if (error) return { error: toUserError(error, 'operations') };
  if (!updated?.length) return { error: 'Task not found or you no longer have access to it.' };

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}

export async function createSocialPostAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const parsed = socialPostSchema.safeParse({
    client_id: formData.get('client_id'),
    title: formData.get('title'),
    caption: formData.get('caption') || undefined,
    scheduled_at: formData.get('scheduled_at') || undefined,
    publish_status: formData.get('publish_status') || 'scheduled',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid social post data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('social_posts').insert({
    organization_id: ctx.organizationId,
    client_id: parsed.data.client_id,
    title: parsed.data.title,
    caption: parsed.data.caption,
    scheduled_at: parsed.data.scheduled_at || null,
    publish_status: parsed.data.publish_status,
  });

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/calendar');
  revalidatePath('/social');
  return { success: true };
}

export async function updateSocialPostApprovalAction(
  postId: string,
  approvalStatus: 'approved' | 'changes_requested'
) {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { error: 'Unauthorized' };

  if (!isUuid(postId)) return { error: 'Invalid post.' };
  if (approvalStatus !== 'approved' && approvalStatus !== 'changes_requested') {
    return { error: 'Invalid approval status.' };
  }

  const supabase = await createClient();
  let query = supabase
    .from('social_posts')
    .update({ approval_status: approvalStatus })
    .eq('id', postId)
    .eq('organization_id', ctx.organizationId);
  // Client users may only act on their own client's posts.
  if (ctx.role === 'client') {
    if (!ctx.clientId) return { error: 'Unauthorized' };
    query = query.eq('client_id', ctx.clientId);
  }
  const { data: updated, error } = await query.select('id');

  if (error) return { error: toUserError(error, 'operations') };
  if (!updated?.length) return { error: 'Post not found or you no longer have access to it.' };

  revalidatePath('/calendar');
  revalidatePath('/social');
  revalidatePath('/approvals');
  return { success: true };
}

export async function updateOrganizationAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || (ctx.role !== 'super_admin' && ctx.role !== 'agency_admin')) {
    return { error: 'Unauthorized: admin access required.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const domain = String(formData.get('domain') ?? '').trim();

  if (name.length < 2) {
    return { error: 'Organization name must be at least 2 characters.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ name, domain: domain || null })
    .eq('id', ctx.organizationId);

  if (error) return { error: toUserError(error, 'operations') };

  revalidatePath('/settings');
  return { success: true };
}

export async function updateMemberRoleAction(input: {
  memberId: string;
  role: string;
  clientId: string | null;
  isActive: boolean;
}) {
  const ctx = await getCurrentUserContext();
  if (!ctx || (ctx.role !== 'super_admin' && ctx.role !== 'agency_admin')) {
    return { error: 'Unauthorized: admin access required to change user roles.' };
  }

  const validRoles = [
    'super_admin',
    'agency_admin',
    'marketing_manager',
    'sales_bd',
    'team_member',
    'client',
  ];
  if (!validRoles.includes(input.role)) {
    return { error: 'Invalid role selected.' };
  }

  if (!uuidField().safeParse(input.memberId).success) {
    return { error: 'Invalid member.' };
  }
  if (input.role === 'client' && !uuidField().safeParse(input.clientId ?? '').success) {
    return { error: 'Select the client this user belongs to.' };
  }

  const supabase = await createClient();

  const { data: target, error: targetError } = await supabase
    .from('organization_members')
    .select('id, role, is_active')
    .eq('id', input.memberId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  if (targetError) return { error: 'Could not load this member. Please try again.' };
  if (!target) return { error: 'Member not found.' };

  const callerIsSuper = ctx.role === 'super_admin';
  if (input.role === 'super_admin' && target.role !== 'super_admin' && !callerIsSuper) {
    return { error: 'Only a Super Admin can grant the Super Admin role.' };
  }
  if (target.role === 'super_admin' && !callerIsSuper) {
    return { error: 'Only a Super Admin can change another Super Admin.' };
  }

  const adminRoles = ['super_admin', 'agency_admin'];
  const removesAdmin =
    target.is_active &&
    adminRoles.includes(target.role) &&
    (!input.isActive || !adminRoles.includes(input.role));

  if (removesAdmin) {
    const { count, error: countError } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('is_active', true)
      .in('role', adminRoles)
      .neq('id', input.memberId);

    if (countError) return { error: 'Could not verify remaining admins. Please try again.' };
    if (!count) {
      return { error: 'The organization must keep at least one active admin.' };
    }
  }

  // The database trigger (migration 0008) enforces the same rules atomically.
  const { error } = await supabase
    .from('organization_members')
    .update({
      role: input.role,
      client_id: input.role === 'client' ? input.clientId : null,
      is_active: input.isActive,
    })
    .eq('id', input.memberId)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: toUserError(error, 'operations') };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'member.role_updated',
    entity_type: 'organization_member',
    entity_id: input.memberId,
    details: { role: input.role, clientId: input.clientId, isActive: input.isActive },
  });

  revalidatePath('/settings/team');
  return { success: true };
}

const invoiceSchema = z.object({
  client_id: uuidField('Select a valid client'),
  invoice_number: z.string().trim().min(3, 'Invoice number is required'),
  amount_inr: z.coerce.number().positive('Amount must be greater than 0'),
  due_date: z.string().min(8, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('sent'),
  notes: z.string().trim().optional(),
});

export async function createInvoiceAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || (ctx.role !== 'super_admin' && ctx.role !== 'agency_admin')) {
    return { error: 'Unauthorized: admin access required to create invoices.' };
  }

  const parsed = invoiceSchema.safeParse({
    client_id: formData.get('client_id'),
    invoice_number: formData.get('invoice_number'),
    amount_inr: formData.get('amount_inr'),
    due_date: formData.get('due_date'),
    status: formData.get('status') || 'sent',
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid invoice data.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: ctx.organizationId,
      ...parsed.data,
    })
    .select('id')
    .single();

  if (error) return { error: toUserError(error, 'operations') };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'invoice.created',
    entity_type: 'invoice',
    entity_id: data.id,
    details: {
      invoice_number: parsed.data.invoice_number,
      amount_inr: parsed.data.amount_inr,
    },
  });

  revalidatePath('/billing');
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { success: true };
}

export async function recordPaymentAction(formData: FormData) {
  const ctx = await getCurrentUserContext();
  if (!ctx || (ctx.role !== 'super_admin' && ctx.role !== 'agency_admin')) {
    return { error: 'Unauthorized: admin access required to record payments.' };
  }

  const invoiceId = String(formData.get('invoice_id') ?? '');
  const amountInr = Number(formData.get('amount_inr') ?? 0);
  const paymentMethod = String(formData.get('payment_method') ?? 'Bank Transfer / NEFT').trim();
  const referenceNumber = String(formData.get('reference_number') ?? '').trim();

  if (!isUuid(invoiceId) || !Number.isFinite(amountInr) || amountInr <= 0) {
    return { error: 'Valid invoice and positive payment amount are required.' };
  }
  if (paymentMethod.length > 100 || referenceNumber.length > 100) {
    return { error: 'Payment method and reference must be under 100 characters.' };
  }

  // One transaction: locks the invoice, rejects overpayment and duplicate references,
  // records the payment, marks the invoice paid only when fully settled, and audits it.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('record_payment', {
    p_invoice_id: invoiceId,
    p_amount_inr: Math.round(amountInr * 100) / 100,
    p_payment_method: paymentMethod,
    p_reference_number: referenceNumber,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'A payment with this reference number is already recorded for this invoice.' };
    }
    return { error: toUserError(error, 'recordPayment') };
  }

  const result = data as { status: string; balance_inr: number } | null;

  revalidatePath('/billing');
  return {
    success: true,
    status: result?.status ?? null,
    balanceInr: result ? Number(result.balance_inr) : null,
  };
}
