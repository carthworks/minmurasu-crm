import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === 'subscribe' && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Meta webhook payloads are small; anything larger is rejected before hashing.
const MAX_BODY_BYTES = 1_000_000;

export async function POST(request: Request) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Fail closed: never accept unsigned payloads, even if the secret is misconfigured.
    console.error('WHATSAPP_APP_SECRET is not set; rejecting WhatsApp webhook.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signatureHeader = request.headers.get('x-hub-signature-256');
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  const signatureVerified = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!signatureVerified) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const admin = createSupabaseAdmin(supabaseUrl, serviceKey);
    await admin.from('whatsapp_webhook_events').insert({
      event_type: 'whatsapp_cloud_webhook',
      payload,
      signature_verified: signatureVerified,
      processed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true, signatureVerified });
}
