import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts', 'src/worker.ts', 'src/seed.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  sourcemap: true,
  external: ['pg'],
  noExternal: [/^@aim\//],
})
