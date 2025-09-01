// ==================== next.config.js ====================
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize for production builds
  swcMinify: true,
  
  // Enable experimental features that might be helpful
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['lucide-react'],
  },
  
  // Configure headers for better security and performance
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // CSP header to allow dynamic imports and ensure security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  },
  
  // Webpack configuration for better bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize chunk splitting for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate vendor chunks for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate lucide-react icons for better caching
          icons: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 15,
          },
          // Group common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }
    
    // Ignore source map warnings for production builds
    if (!dev) {
      config.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Failed to parse source map/,
        },
      ]
    }
    
    return config
  },
  
  // Configure output for static export if needed
  // Uncomment the lines below if you want to deploy as static files
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // },
  
  // Configure environment variables that should be available on client side
  env: {
    // Add any environment variables you want to expose to the client
    NEXT_PUBLIC_APP_NAME: 'Time Balance',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Configure image optimization (if using next/image)
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configure redirects if needed
  async redirects() {
    return [
      // Example redirect - remove if not needed
      // {
      //   source: '/old-page',
      //   destination: '/',
      //   permanent: true,
      // },
    ]
  },
  
  // Configure rewrites if needed
  async rewrites() {
    return [
      // Example rewrite - remove if not needed
      // {
      //   source: '/api/:path*',
      //   destination: 'https://external-api.com/:path*',
      // },
    ]
  },
  
  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // PoweredByHeader: false, // Uncomment to remove X-Powered-By header
}

module.exports = nextConfig
