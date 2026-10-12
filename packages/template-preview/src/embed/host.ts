/**
 * 宿主端嵌入（零依赖，任意框架 / 原生页面可用）
 *
 * @example
 * const embed = createPreviewEmbed({
 *   container: document.getElementById('preview')!,
 *   src: 'https://m.example.com/embed',
 *   document: tpl,
 *   options: { vendor: 'huawei', mode: 'phone' },
 *   onAction: (e) => console.log(e),
 * })
 * embed.update(nextTpl)
 */
import type { TemplateDocument } from '@aim/template-schema'
import {
  EMBED_SOURCE,
  isEmbedMessage,
  type EmbedRenderOptions,
  type HostMessage,
  type ReceiverMessage,
} from './protocol'

export * from './protocol'

export interface CreatePreviewEmbedOptions {
  container: HTMLElement
  /** 接收端页面地址（部署了 mountPreviewReceiver 的页面，如 apps/mobile 的 /embed） */
  src: string
  document?: TemplateDocument
  legacy?: { pages: string | unknown[]; cardId?: string }
  options?: EmbedRenderOptions
  /** 自动根据内容调整 iframe 高度 */
  autoHeight?: boolean
  onAction?: (e: { event: Record<string, unknown>; label?: string }) => void
  onReady?: () => void
  onError?: (message: string) => void
  title?: string
}

export interface PreviewEmbed {
  iframe: HTMLIFrameElement
  update: (document: TemplateDocument, options?: EmbedRenderOptions) => void
  updateLegacy: (
    legacy: { pages: string | unknown[]; cardId?: string },
    options?: EmbedRenderOptions,
  ) => void
  setOptions: (options: EmbedRenderOptions) => void
  destroy: () => void
}

export function createPreviewEmbed(config: CreatePreviewEmbedOptions): PreviewEmbed {
  const iframe = document.createElement('iframe')
  const origin = new URL(config.src, window.location.href).origin
  iframe.src = config.src
  iframe.title = config.title ?? '模板预览'
  iframe.style.cssText = 'border:0;width:100%;display:block;background:transparent;'
  iframe.setAttribute('loading', 'lazy')
  config.container.appendChild(iframe)

  let ready = false
  let pending: HostMessage | null =
    config.document || config.legacy
      ? {
          source: EMBED_SOURCE,
          type: 'render',
          document: config.document,
          legacy: config.legacy,
          options: config.options,
        }
      : null

  const post = (msg: HostMessage) => {
    if (!ready) {
      pending = msg
      return
    }
    iframe.contentWindow?.postMessage(msg, origin)
  }

  const onMessage = (e: MessageEvent) => {
    if (
      e.origin !== origin ||
      e.source !== iframe.contentWindow ||
      !isEmbedMessage<ReceiverMessage>(e.data)
    )
      return
    const msg = e.data
    if (msg.type === 'ready') {
      ready = true
      if (pending) post(pending)
      pending = null
      config.onReady?.()
    } else if (msg.type === 'resize' && config.autoHeight !== false) {
      iframe.style.height = `${Math.ceil(msg.height)}px`
    } else if (msg.type === 'action') {
      config.onAction?.({ event: msg.event, label: msg.label })
    } else if (msg.type === 'error') {
      config.onError?.(msg.message)
    }
  }
  window.addEventListener('message', onMessage)

  return {
    iframe,
    update: (doc, options) =>
      post({
        source: EMBED_SOURCE,
        type: 'render',
        document: doc,
        options: options ?? config.options,
      }),
    updateLegacy: (legacy, options) =>
      post({ source: EMBED_SOURCE, type: 'render', legacy, options: options ?? config.options }),
    setOptions: (options) => post({ source: EMBED_SOURCE, type: 'options', options }),
    destroy: () => {
      window.removeEventListener('message', onMessage)
      iframe.remove()
    },
  }
}
