import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { WhatsAppInbox, type ConversationSummary } from '@/components/whatsapp/whatsapp-inbox';

async function WhatsAppContent() {
  const apiConfigured = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );

  if (!isSupabaseConfigured()) {
    return <WhatsAppInbox apiConfigured={apiConfigured} conversations={[]} />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, status, last_customer_message_at, whatsapp_contacts(profile_name, phone_number, opt_in_status)')
    .order('updated_at', { ascending: false });

  const conversations: ConversationSummary[] = (data ?? []).map((row) => {
    const contact = row.whatsapp_contacts as unknown as {
      profile_name: string | null;
      phone_number: string;
      opt_in_status: boolean;
    } | null;
    return {
      id: row.id,
      contactName: contact?.profile_name || contact?.phone_number || 'Unknown Contact',
      phoneNumber: contact?.phone_number || '—',
      optIn: contact?.opt_in_status ?? false,
      status: row.status,
      lastCustomerMessageAt: row.last_customer_message_at,
    };
  });

  return <WhatsAppInbox apiConfigured={apiConfigured} conversations={conversations} />;
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading WhatsApp Inbox...</div>}>
      <WhatsAppContent />
    </Suspense>
  );
}
