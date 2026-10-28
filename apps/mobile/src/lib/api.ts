import {
  createExperienceApi,
  createHttpClient,
  createWorkspaceExperienceApi,
} from '@aim/api-client'
import { createExperienceHooks } from '@aim/api-client/react'
import { getIdentity } from './auth'
export const env = {
  mock: process.env.NEXT_PUBLIC_API_MOCK === 'true',
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  editorUrl: process.env.NEXT_PUBLIC_WEB_URL ?? '',
}
export const http = createHttpClient({ baseUrl: env.apiBase })
export const api = env.mock ? createExperienceApi(http) : createWorkspaceExperienceApi(getIdentity)
export const hooks = createExperienceHooks(api, getIdentity)
