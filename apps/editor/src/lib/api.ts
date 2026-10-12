import { createEditorApi, createHttpClient } from '@aim/api-client'
import { createEditorHooks } from '@aim/api-client/react'
import { toast } from '@aim/ui'

export const env = {
  mock: process.env.NEXT_PUBLIC_API_MOCK !== 'false',
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  mobileUrl: process.env.NEXT_PUBLIC_MOBILE_URL ?? 'http://localhost:3001',
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3002',
}

export const http = createHttpClient({
  baseUrl: env.apiBase,
  onError: (e) => toast.error(e.message),
})

export const editorApi = createEditorApi(http)
export const editorHooks = createEditorHooks(editorApi)
