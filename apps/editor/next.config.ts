import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@aim/ui',
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

export default config
