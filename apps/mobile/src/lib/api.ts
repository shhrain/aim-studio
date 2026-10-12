import { createExperienceApi, createHttpClient } from '@aim/api-client'
import { createExperienceHooks } from '@aim/api-client/react'
import { toast } from '@aim/ui'
import { clearAuth, getToken } from './auth'

export const env = {
  mock: process.env.NEXT_PUBLIC_API_MOCK !== 'false',
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  editorUrl: process.env.NEXT_PUBLIC_EDITOR_URL ?? 'http://localhost:3000',
}

export const http = createHttpClient({
  baseUrl: env.apiBase,
  getToken,
  onError: (e) => toast.error(e.message),
  onUnauthorized: () => {
    clearAuth()
    if (typeof window !== 'undefined' && !location.pathname.startsWith('/auth-required')) {
      location.replace(
        `/auth-required?reason=expired&redirect=${encodeURIComponent(location.pathname + location.search)}`,
      )
    }
  },
})

export const api = createExperienceApi(http)
export const hooks = createExperienceHooks(api)
