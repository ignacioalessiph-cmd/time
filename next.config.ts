/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Only include basic webpack config
  webpack: (config, { dev }) => {
    // Ignore source map warnings in production
    if (!dev) {
      config.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Failed to parse source map/,
        },
      ]
    }
    return config
  }
}

module.exports = nextConfig
