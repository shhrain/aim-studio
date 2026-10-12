import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts', 'embed/receiver': 'src/embed/receiver.tsx', 'element/index': 'src/element/index.tsx' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    banner: { js: "'use client';" },
  },
  {
    // 宿主端嵌入脚本：零依赖，可在任意框架使用
    entry: { 'embed/host': 'src/embed/host.ts' },
    format: ['esm', 'iife'],
    globalName: 'AimPreviewEmbed',
    dts: true,
    sourcemap: true,
  },
])
