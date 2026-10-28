import { createEditorApi, createHttpClient, createWorkspaceEditorApi } from '@aim/api-client'
import { createEditorHooks } from '@aim/api-client/react'
import { toast } from '@aim/ui'
export const env = {
  mock: process.env.NEXT_PUBLIC_API_MOCK === 'true',
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  mobileUrl: process.env.NEXT_PUBLIC_MOBILE_URL ?? '/m',
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3002',
}
export const http = createHttpClient({
  baseUrl: env.apiBase,
  onError: (e) => toast.error(e.message),
})
const scope = () =>
  typeof location === 'undefined' ? '' : (/\/app\/w\/([^/]+)/.exec(location.pathname)?.[1] ?? '')
export const editorApi = env.mock
  ? createEditorApi(http)
  : createWorkspaceEditorApi(
      () => {
        const ws = scope()
        if (!ws) throw new Error('请从工作空间进入模板编辑器')
        return ws
      },
      {
        baseUrl: env.apiBase,
        onError: (e) =>
          toast.error(
            typeof location !== 'undefined' && location.pathname.startsWith('/en/')
              ? e.status === 409
                ? 'This template changed elsewhere. Export a backup before reloading.'
                : 'Request failed. Please try again.'
              : e.message,
          ),
      },
    )
export const editorHooks = createEditorHooks(editorApi, scope)
