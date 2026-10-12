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
  // 允许局域网设备访问开发服务（手机扫码预览）
  allowedDevOrigins: ['*.local', '192.168.*.*', '10.*.*.*', '172.*.*.*'],
}

export default config
