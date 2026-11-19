import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a Meta (WhatsApp Cloud API) `X-Hub-Signature-256` header:
 * `sha256=<hex HMAC-SHA256 of the raw request body, keyed with the app secret>`.
 * Returns false for a missing secret or header, never throws.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string | null | undefined
): boolean {
  if (!appSecret || !signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
