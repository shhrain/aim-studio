'use client'

import { createDocument } from '@aim/template-core'
import { buildSampleTemplates } from '@aim/mock/fixtures'
import { TemplatePreview } from '@aim/template-preview'
import { LAYOUTS, PROTOCOL_META, VENDOR_LIST, type Protocol } from '@aim/template-schema'
import { Badge, Button, PageHeader, Segmented, SimpleSelect } from '@aim/ui'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/app-header'

/** 版式画廊：全部版式 × 厂商 × 协议（亦作为视觉回归基准页） */
export function GalleryView() {
  const [vendor, setVendor] = useState('huawei')
  const [protocol, setProtocol] = useState<Protocol>('aim')
  const [source, setSource] = useState<'blank' | 'sample'>('blank')
  const docs = useMemo(() => {
    if (source === 'sample') return buildSampleTemplates(0).map((s) => s.document)
    return LAYOUTS.map((l) => createDocument({ layoutId: l.id, name: l.name, now: 0 }))
  }, [source])
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1440px] space-y-5 px-6 py-6">
          <PageHeader
            title="版式画廊"
            description={`${LAYOUTS.length} 个版式在不同厂商与协议下的渲染效果`}
            actions={
              <div className="flex items-center gap-2" data-testid="gallery-controls">
                <Segmented
                  value={source}
                  onValueChange={setSource}
                  options={[
                    { value: 'blank', label: '空白版式' },
                    { value: 'sample', label: '示例模板' },
                  ]}
                />
                <SimpleSelect value={vendor} onValueChange={setVendor} options={VENDOR_LIST.map((v) => ({ value: v.id, label: v.name }))} className="w-28" aria-label="厂商" />
                <Segmented value={protocol} onValueChange={setProtocol} options={(['aim', 'rcs', 'rms'] as const).map((p) => ({ value: p, label: PROTOCOL_META[p].terminal }))} />
              </div>
            }
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {docs.map((doc) => (
              <figure key={doc.id} className="flex flex-col items-center gap-2" data-testid={`gallery-${doc.layoutId}`}>
                <TemplatePreview document={doc} vendor={vendor} protocol={protocol} width={280} paramDisplay="example" showTime={false} />
                <figcaption className="flex items-center gap-1.5 text-sm">
                  {doc.name}
                  {LAYOUTS.find((l) => l.id === doc.layoutId)?.protocols.includes('rcs') && <Badge variant="success">三信融合</Badge>}
                  <Button size="xs" variant="link" asChild>
                    <Link href={`/editor/new?layout=${doc.layoutId}`}>使用</Link>
                  </Button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
