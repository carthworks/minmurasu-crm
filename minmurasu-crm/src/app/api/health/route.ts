import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'minmurasu-crm',
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
