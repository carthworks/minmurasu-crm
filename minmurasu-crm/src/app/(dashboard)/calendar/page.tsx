import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { SocialCalendar, type SocialPostRow } from '@/components/ops/social-calendar';

async function CalendarContent() {
  if (!isSupabaseConfigured()) {
    return <SocialCalendar posts={[]} clients={[]} />;
  }

  const supabase = await createClient();
  const [{ data: postsRaw }, { data: clients }] = await Promise.all([
    supabase
      .from('social_posts')
      .select('id, title, caption, scheduled_at, approval_status, publish_status, clients(name)')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true }),
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
  ]);

  const posts: SocialPostRow[] = (postsRaw ?? []).map((p) => {
    const cl = p.clients as unknown as { name: string } | null;
    return {
      id: p.id,
      title: p.title,
      caption: p.caption,
      scheduled_at: p.scheduled_at,
      approval_status: p.approval_status,
      publish_status: p.publish_status,
      client_name: cl?.name ?? '—',
    };
  });

  return <SocialCalendar posts={posts} clients={clients ?? []} />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading content calendar...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
