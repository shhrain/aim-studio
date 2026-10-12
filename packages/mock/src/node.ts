import { setupServer } from 'msw/node'
import { handlers } from './index'

/** Node 端 Mock（Vitest / 脚本），用法：const server = createMockServer(); server.listen() */
export function createMockServer() {
  return setupServer(...handlers)
}
