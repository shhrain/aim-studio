import { createHttpClient, type HttpClientOptions } from './http'
import { createEditorApi } from './endpoints'
/** 将编辑器原有调用映射到工作空间 API，并维护乐观锁版本。 */
export function createWorkspaceEditorApi(workspace: () => string, options: HttpClientOptions = {}) {
  const revisions = new Map<string, number>()
  return createEditorApi(
    createHttpClient({
      ...options,
      fetch: async (input, init) => {
        const ws = workspace()
        let url = String(input).replace(
          '/api/editor/v1',
          `/api/v1/workspaces/${encodeURIComponent(ws)}`,
        )
        const request = { ...init }
        const key = /\/templates\/([^/?]+)/.exec(url)?.[1]
        const payload = typeof request.body === 'string' ? JSON.parse(request.body) : undefined
        if (request.method === 'PUT' && key)
          request.body = JSON.stringify({
            document: payload,
            revision: revisions.get(`${ws}:${key}`),
          })
        if (request.method === 'POST' && url.endsWith('/submit') && key)
          request.body = JSON.stringify({
            revision: revisions.get(`${ws}:${key}`),
            rcsFallbacks: payload?.rcsFallbacks ?? {},
          })
        if (request.method === 'DELETE' && key) {
          url += '/archive'
          request.method = 'POST'
          request.headers = { ...request.headers, 'Content-Type': 'application/json' }
          request.body = JSON.stringify({ archived: true })
        }
        if (request.method === 'POST' && url.endsWith('/materials') && payload) {
          const match = /^data:([^;,]+);base64,(.+)$/.exec(payload.url ?? '')
          if (!match) throw new Error('请选择本地文件上传')
          const bytes = Uint8Array.from(atob(match[2]!), (ch) => ch.charCodeAt(0))
          const form = new FormData()
          form.set('file', new Blob([bytes], { type: match[1] }), payload.name)
          request.body = form
          const headers = new Headers(request.headers)
          headers.delete('Content-Type')
          request.headers = headers
        }
        const response = await (options.fetch ?? globalThis.fetch)(url, request)
        if (response.ok && /\/templates(?:\/[^/]+)?$/.test(url.split('?')[0]!)) {
          const body = await response.clone().json()
          if (body.data?.id && body.data.revision)
            revisions.set(`${ws}:${body.data.id}`, body.data.revision)
        }
        return response
      },
    }),
  )
}
