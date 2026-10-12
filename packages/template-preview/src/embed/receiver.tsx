'use client'

import type { TemplateDocument } from '@aim/template-schema'
import { useEffect, useRef, useState } from 'react'
import { TemplatePreview } from '../TemplatePreview'
import { EMBED_SOURCE, EMBED_VERSION, isEmbedMessage, type EmbedRenderOptions, type HostMessage, type ReceiverMessage } from './protocol'

export interface PreviewReceiverProps {
  /** 允许的宿主来源；默认允许任意来源（仅渲染，不执行敏感操作） */
  allowOrigins?: string[]
  defaultOptions?: EmbedRenderOptions
}

/**
 * iframe 接收端：放在独立页面（如 /embed）中，接收宿主 postMessage 并渲染预览，
 * 自动回传内容高度与点击事件。
 */
export function PreviewReceiver({ allowOrigins, defaultOptions }: PreviewReceiverProps) {
  const [doc, setDoc] = useState<TemplateDocument | undefined>()
  const [legacy, setLegacy] = useState<{ pages: string | unknown[]; cardId?: string } | undefined>()
  const [options, setOptions] = useState<EmbedRenderOptions>(defaultOptions ?? {})
  const hostOrigin = useRef<string>('*')
  const root = useRef<HTMLDivElement>(null)

  const send = (msg: ReceiverMessage) => window.parent?.postMessage(msg, hostOrigin.current)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!isEmbedMessage<HostMessage>(e.data)) return
      if (allowOrigins && !allowOrigins.includes(e.origin)) return
      hostOrigin.current = e.origin
      const msg = e.data
      if (msg.type === 'render') {
        setDoc(msg.document)
        setLegacy(msg.legacy)
        if (msg.options) setOptions((o) => ({ ...o, ...msg.options }))
      } else if (msg.type === 'options') setOptions((o) => ({ ...o, ...msg.options }))
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ source: EMBED_SOURCE, type: 'ready', version: EMBED_VERSION } satisfies ReceiverMessage, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [allowOrigins])

  useEffect(() => {
    if (!root.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) send({ source: EMBED_SOURCE, type: 'resize', height: entry.contentRect.height, width: entry.contentRect.width })
    })
    ro.observe(root.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={root} style={{ display: 'flex', justifyContent: 'center' }}>
      <TemplatePreview
        document={doc}
        legacy={legacy}
        protocol={options.protocol}
        vendor={options.vendor}
        mode={options.mode ?? 'fluid'}
        params={options.params}
        paramDisplay={options.paramDisplay}
        interactive={options.interactive ?? 'intercept'}
        theme={options.theme}
        chatbotName={options.chatbotName}
        width={options.width}
        emptyText="等待宿主传入模板…"
        onAction={(e) => send({ source: EMBED_SOURCE, type: 'action', event: e.event as Record<string, unknown>, label: e.label })}
      />
    </div>
  )
}
