/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep output as default (Node.js server) - not static export
  // so API routes (proxy) work correctly on Vercel

  // Internal tool: keep every page (incl. public share links) out of search engines
  // Public commercial proposals: /proposal/prop_xxxxxxxx -> public/proposals/prop_xxxxxxxx.html
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/proposal/:slug(prop_[a-f0-9]{8})', destination: '/proposals/:slug.html' },
      ],
    };
  },

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
