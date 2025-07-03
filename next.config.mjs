/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false
  },
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  images: {
    domains: ['localhost']
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

export default nextConfig