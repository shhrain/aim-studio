import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@aim/utils',
    '@aim/template-schema',
    '@aim/template-core',
    '@aim/template-preview',
  ],
  devIndicators: false,
}

export default withMDX(config)
