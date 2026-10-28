import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/openapi.json',
        destination:
          (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000') + '/api/openapi.json',
      },
      {
        source: '/api/v1/:path*',
        destination: (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000') + '/api/v1/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000') + '/api/auth/:path*',
      },
      {
        source: '/m/:path*',
        destination: (process.env.MOBILE_INTERNAL_URL ?? 'http://127.0.0.1:3001') + '/m/:path*',
      },
    ]
  },
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Docker 镜像使用 standalone 产物（NEXT_OUTPUT=standalone），追踪根目录为 monorepo 根
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  transpilePackages: [
    '@aim/ui',
    '@aim/i18n',
    '@aim/api-contracts',
    '@aim/utils',
    '@aim/template-schema',
    '@aim/template-core',
    '@aim/template-preview',
    '@aim/api-client',
    '@aim/mock',
  ],
  devIndicators: false,
  poweredByHeader: false,
}

export default createNextIntlPlugin('./src/i18n/request.ts')(config)
