/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep output as default (Node.js server) - not static export
  // so API routes (proxy) work correctly on Vercel

  // Internal tool: keep every page (incl. public share links) out of search engines
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

export default nextConfig;
