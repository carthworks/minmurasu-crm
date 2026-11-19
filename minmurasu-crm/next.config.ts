import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

// The browser talks to Supabase directly (auth + data); everything else goes through our server.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "https://*.supabase.co";
  }
})();
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");

// Vercel's preview toolbar / comments, only on preview deployments.
const vercelLive = isVercelPreview ? " https://vercel.live https://*.pusher.com wss://*.pusher.com" : "";

// Static (non-nonce) CSP. Nonces are incompatible with Partial Prerendering
// (cacheComponents), so inline scripts must be allowed; the policy still blocks
// third-party scripts, plugins, <base> hijacking, framing, and off-site form posts
// and connections.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${vercelLive}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  // Organization logos may be hosted anywhere over HTTPS.
  `img-src 'self' data: blob: https:`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}${vercelLive}`,
  `frame-src 'none'${isVercelPreview ? " https://vercel.live" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
