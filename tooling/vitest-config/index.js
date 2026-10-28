import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const setupDom = fileURLToPath(new URL('./setup-dom.js', import.meta.url))

/**
 * 生成统一的 Vitest 配置。
 * @param {{ environment?: 'node' | 'jsdom', react?: boolean, setupFiles?: string[] }} [options]
 */
export function createVitestConfig(options = {}) {
  const environment = options.environment ?? 'node'
  return defineConfig({
    plugins: options.react ? [react()] : [],
    test: {
      environment,
      pool: 'threads',
      maxWorkers: 2,
      globals: false,
      include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
      setupFiles: [...(environment === 'jsdom' ? [setupDom] : []), ...(options.setupFiles ?? [])],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['**/*.stories.*', '**/*.test.*'],
      },
    },
  })
}
