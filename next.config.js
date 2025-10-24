/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/language']
  },
}

module.exports = nextConfig
