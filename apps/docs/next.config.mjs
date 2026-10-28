import path from 'node:path'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Docker 镜像使用 standalone 产物（NEXT_OUTPUT=standalone），追踪根目录为 monorepo 根
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  transpilePackages: [
    '@aim/utils',
    '@aim/template-schema',
    '@aim/template-core',
    '@aim/template-preview',
  ],
  devIndicators: false,
}

export default withMDX(config)
