/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All MVP tools are 100% client-side — no server compute needed for them.
  // Static generation everywhere possible keeps this on the free/hobby tier
  // of hosting for a long time.
};

module.exports = nextConfig;
