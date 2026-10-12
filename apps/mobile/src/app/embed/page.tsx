'use client'

import { PreviewReceiver } from '@aim/template-preview/embed/receiver'

/** iframe 嵌入接收端：宿主通过 @aim/template-preview/embed 的 createPreviewEmbed 传入模板 */
export default function EmbedPage() {
  return (
    <div style={{ background: 'transparent', padding: 8 }}>
      <PreviewReceiver defaultOptions={{ mode: 'fluid', paramDisplay: 'example' }} />
    </div>
  )
}
