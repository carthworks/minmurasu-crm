import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ContactsManager, type ContactItem } from '@/components/crm/contacts-manager';

async function ContactsContent() {
  if (!isSupabaseConfigured()) {
    return <ContactsManager contacts={[]} clients={[]} />;
  }

  const supabase = await createClient();
  const [{ data: contactsRaw }, { data: clients }] = await Promise.all([
    supabase
      .from('client_contacts')
      .select('id, full_name, role_title, email, phone, whatsapp_number, is_primary, clients(name)')
      .is('deleted_at', null)
      .order('full_name'),
    supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
  ]);

  const contacts: ContactItem[] = (contactsRaw ?? []).map((c) => {
    const rel = c.clients as unknown as { name: string } | null;
    return {
      id: c.id,
      full_name: c.full_name,
      role_title: c.role_title,
      email: c.email,
      phone: c.phone,
      whatsapp_number: c.whatsapp_number,
      is_primary: c.is_primary,
      client_name: rel?.name ?? '—',
    };
  });

  return <ContactsManager contacts={contacts} clients={clients ?? []} />;
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading contacts...</div>}>
      <ContactsContent />
    </Suspense>
  );
}
