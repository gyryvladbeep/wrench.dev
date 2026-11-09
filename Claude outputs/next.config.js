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
  // Deliberately NOT included here: a Content-Security-Policy. A real CSP
  // has to enumerate every script/style/connect/img source this app
  // actually needs (Stripe.js, Vercel Analytics, Google Fonts if any,
  // Supabase's REST/Realtime endpoints, the AI SDK's streaming responses,
  // the site's own inline styles) and get load-tested before shipping —
  // guessing at one here without being able to load the live site in this
  // environment risks silently breaking checkout, auth, or an AI tool.
  // That one needs to be written and tested by whoever can run the app.
  async headers() {
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;
