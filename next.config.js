/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
=======
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
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
  },
}

module.exports = nextConfig
