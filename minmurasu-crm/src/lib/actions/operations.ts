'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageCampaigns, isAgencyStaffRole } from '@/lib/auth/rbac';

const campaignSchema = z.object({
  client_id: z.string().uuid('Select a valid client'),
  channel_id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Campaign name is required'),
  objective: z.string().trim().optional(),
  budget_inr: z.coerce.number().min(0).default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'optimization', 'completed']).default('active'),
});

const metricSchema = z.object({
  campaign_id: z.string().uuid(),
  client_id: z.string().uuid(),
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
  client_id: z.string().uuid('Select a valid client'),
  name: z.string().trim().min(2, 'Project name is required'),
  description: z.string().trim().optional(),
  due_date: z.string().optional(),
});

const taskSchema = z.object({
  project_id: z.string().uuid('Select a valid project'),
  client_id: z.string().uuid('Select a valid client'),
  title: z.string().trim().min(2, 'Task title is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z
    .enum(['backlog', 'todo', 'in_progress', 'in_review', 'client_approval', 'completed'])
    .default('todo'),
  due_date: z.string().optional(),
});

const socialPostSchema = z.object({
  client_id: z.string().uuid('Select a valid client'),
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

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !isAgencyStaffRole(ctx.role)) {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: error.message };

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

  if (error) return { error: error.message };

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

  const supabase = await createClient();
  const { error } = await supabase
    .from('social_posts')
    .update({ approval_status: approvalStatus })
    .eq('id', postId)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: error.message };

  revalidatePath('/calendar');
  revalidatePath('/social');
  revalidatePath('/approvals');
  return { success: true };
}
