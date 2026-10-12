import type { TemplateDocument } from '@aim/template-schema'

/** iframe 嵌入通信协议（postMessage），消息均带 source 标识 */
export const EMBED_SOURCE = 'aim-preview'
export const EMBED_VERSION = 1

export interface EmbedRenderOptions {
  protocol?: 'aim' | 'rcs' | 'rms'
  vendor?: string
  mode?: 'phone' | 'bare' | 'fluid' | 'thumbnail'
  params?: Record<string, string>
  paramDisplay?: 'value' | 'example' | 'token'
  interactive?: 'intercept' | 'native' | 'none'
  theme?: 'light' | 'dark'
  chatbotName?: string
  width?: number | string
}

export type HostMessage =
  | {
      source: typeof EMBED_SOURCE
      type: 'render'
      document?: TemplateDocument
      legacy?: { pages: string | unknown[]; cardId?: string }
      options?: EmbedRenderOptions
    }
  | { source: typeof EMBED_SOURCE; type: 'options'; options: EmbedRenderOptions }

export type ReceiverMessage =
  | { source: typeof EMBED_SOURCE; type: 'ready'; version: number }
  | { source: typeof EMBED_SOURCE; type: 'resize'; height: number; width: number }
  | { source: typeof EMBED_SOURCE; type: 'action'; event: Record<string, unknown>; label?: string }
  | { source: typeof EMBED_SOURCE; type: 'error'; message: string }

export function isEmbedMessage<T extends { source: string }>(data: unknown): data is T {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { source?: string }).source === EMBED_SOURCE
  )
}
