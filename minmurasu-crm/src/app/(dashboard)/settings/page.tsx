import { Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/auth/session';
import { canManageSettings } from '@/lib/auth/rbac';
import { SettingsManager } from '@/components/settings/settings-manager';

async function SettingsContent() {
  let orgName = 'MIN MURASU';
  let orgDomain = 'minmurasu.digital';
  let canEdit = false;

  if (isSupabaseConfigured()) {
    const ctx = await getCurrentUserContext();
    canEdit = ctx ? canManageSettings(ctx.role) : false;

    if (ctx) {
      const supabase = await createClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('name, domain')
        .eq('id', ctx.organizationId)
        .maybeSingle();

      if (org) {
        orgName = org.name;
        orgDomain = org.domain ?? 'minmurasu.digital';
      }
    }
  }

  return (
    <SettingsManager
      organization={{ name: orgName, domain: orgDomain }}
      canEdit={canEdit}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
