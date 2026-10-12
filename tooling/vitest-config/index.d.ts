import type { UserConfig } from 'vitest/config'

export interface AimVitestOptions {
  environment?: 'node' | 'jsdom'
  react?: boolean
  setupFiles?: string[]
}

export declare function createVitestConfig(options?: AimVitestOptions): UserConfig
