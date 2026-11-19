'use client';

// Replaces the root layout when it fails, so it must render its own <html>/<body>
// and cannot rely on globals.css or the theme provider.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          padding: 16,
        }}
      >
        <main style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>MIN MURASU CRM is temporarily unavailable</h1>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>
            Something went wrong while loading the app. Please try again in a moment.
          </p>
          {digest && (
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              Reference: <code>{digest}</code>
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              border: 0,
              borderRadius: 12,
              padding: '10px 18px',
              background: '#0f172a',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
