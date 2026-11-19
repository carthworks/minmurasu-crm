import type { Instrumentation } from 'next';

/**
 * Server-side error reporting for Server Components, Route Handlers, Server Actions
 * and the proxy. Emits one structured JSON line per error (searchable in Vercel logs)
 * and, if ERROR_WEBHOOK_URL is set, forwards the same payload there (e.g. a Slack,
 * Sentry-ingest or log-drain endpoint).
 *
 * Request headers and query strings are deliberately NOT included: they carry auth
 * cookies and can carry personal data.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined;

  const payload = {
    level: 'error',
    source: 'minmurasu-crm',
    message: error.message,
    name: error.name,
    digest,
    stack: error.stack?.split('\n').slice(0, 8).join('\n'),
    method: request.method,
    path: request.path.split('?')[0],
    routePath: context.routePath,
    routeType: context.routeType,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    at: new Date().toISOString(),
  };

  console.error(JSON.stringify(payload));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3_000),
      });
    } catch {
      // Never let error reporting throw.
    }
  }
};
