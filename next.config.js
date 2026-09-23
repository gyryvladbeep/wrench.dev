/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All MVP tools are 100% client-side — no server compute needed for them.
  // Static generation everywhere possible keeps this on the free/hobby tier
  // of hosting for a long time.

  // Baseline security response headers — there was previously no headers()
  // here and no vercel.json either, so the app shipped with none of these
  // set at all (verified by reading the deployed response headers via the
  // security audit). These four are safe, framework-agnostic defaults that
  // don't require knowing every script/style/font source the app uses, so
  // they're applied globally without risk of breaking a tool.
  //
  // Content-Security-Policy — added in the 2026-09-23 audit, in
  // Report-Only mode (see buildCsp() below). The previous audit left
  // this out entirely because guessing at an enforcing policy without
  // being able to load the live site risks silently breaking checkout,
  // auth, or an AI tool. Report-Only sidesteps exactly that risk: the
  // browser evaluates the policy and reports violations (visible in
  // DevTools → Console on any page load) but never blocks anything, so
  // shipping it can't break the site. Sources below were derived from a
  // static read of the codebase, not from traffic-capture on the live
  // site — treat the console for a few days of normal use (including a
  // checkout, a login, and each AI tool) as the real test. Once it's
  // quiet, swap the header key below from
  // "Content-Security-Policy-Report-Only" to "Content-Security-Policy"
  // to start enforcing it.
  //
  // What the app actually loads, and why each directive is what it is:
  // - script-src: only 'self' — there's no @stripe/stripe-js usage (checkout
  //   is a server-created Stripe session the browser reaches via a full
  //   page redirect, `window.location.href = url`, not a script/iframe —
  //   see lib/hooks/useSubscription.ts), Vercel Analytics' script is
  //   served same-origin, and AI tools call the site's own /api/* routes,
  //   never a provider API directly from the browser. 'unsafe-inline' is
  //   still required because Next's App Router hydration payload ships as
  //   inline <script> tags with no nonce wired up (that's a separate,
  //   bigger follow-up — middleware-based nonce injection — not something
  //   to bolt on blind); it still blocks a classic XSS payload that tries
  //   to load a SEPARATE script from an attacker-controlled origin.
  // - style-src: 'self' + fonts.googleapis.com for the portfolio themes'
  //   Google Fonts stylesheet (see PORTFOLIO_GOOGLE_FONTS_HREF in
  //   lib/portfolio.ts) — the rest of the app's fonts are self-hosted via
  //   next/font/google and need no external style-src at all.
  // - font-src: fonts.gstatic.com, where that Google Fonts stylesheet's
  //   actual font files are served from.
  // - img-src: 'self' + data:/blob: — QR codes (QRCode.toDataURL) and
  //   any canvas/blob-based downloads are data:/blob: URLs; there are no
  //   external avatar/image hosts anywhere in the app (avatars are a
  //   generated color + initials, not an uploaded/fetched image).
  // - connect-src: 'self' + the configured Supabase project URL (read
  //   from NEXT_PUBLIC_SUPABASE_URL at build time, so this always matches
  //   whatever project the deployment is actually wired to) — every
  //   Supabase call from the browser is REST over https, there is no
  //   Realtime/websocket subscription anywhere in the app (webhook bins
  //   and mock endpoints poll instead, see lib/hooks/useWebhookBins.ts),
  //   so no wss: entry is needed.
  // - frame-src: 'self' — the Trainer's project-exercise sandbox
  //   (lib/trainer/run-project-exercise.ts, components/trainer/TrainerClient.tsx)
  //   uses `sandbox="allow-scripts"` srcdoc iframes, which are same-document
  //   content, not a navigation to an external origin.
  // - object-src 'none', base-uri 'self', frame-ancestors 'none' — standard
  //   hardening with nothing in the app that needs an exception; frame-ancestors
  //   is the CSP-level version of the X-Frame-Options header below.
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          // Blocks the whole site from being framed by another origin
          // (clickjacking) — nothing here is meant to be embedded cross-site.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Stops browsers from MIME-sniffing responses away from their
          // declared Content-Type (e.g. treating a JSON/text response as
          // executable script).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sends the full referrer only to same-origin requests, and just
          // the origin (no path/query) cross-origin — avoids leaking
          // internal paths or query strings (e.g. tokens someone pasted
          // into a tool's URL) to third-party destinations.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Opts out of browser features this site never uses, for every
          // origin including its own — reduces what a compromised/XSS'd
          // page could ask the browser for.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // Report-Only — see the long comment above. Change the key to
          // "Content-Security-Policy" once the console is quiet.
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
