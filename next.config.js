/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost', port: '3000' },
    ],
  },
  // Use top-level typedRoutes per Next.js 16 guidance
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
