import path from 'node:path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  basePath: '/m',
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Docker 镜像使用 standalone 产物（NEXT_OUTPUT=standalone），追踪根目录为 monorepo 根
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
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
