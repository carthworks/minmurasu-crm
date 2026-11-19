import type { SupabaseClient } from '@supabase/supabase-js';

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'limited' | 'unavailable' };

/**
 * Per-user rate limit backed by Postgres (`check_rate_limit`, migration 0009), so the
 * count is shared across every serverless instance. Must be called with the user's
 * authenticated Supabase client; the bucket is keyed by auth.uid() in the database.
 *
 * Fails closed: if the limiter itself errors, the request is refused rather than
 * letting traffic through to paid upstream APIs unmetered.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('[rate-limit]', error.code, error.message);
    return { allowed: false, reason: 'unavailable' };
  }
  return data === true ? { allowed: true } : { allowed: false, reason: 'limited' };
}
