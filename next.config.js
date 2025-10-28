/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.ASSET_PREFIX || '',
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: false
  }
};

module.exports = nextConfig;