/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Simplified experimental config
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Basic environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'Time Balance',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Basic image configuration
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}

module.exports = nextConfig
