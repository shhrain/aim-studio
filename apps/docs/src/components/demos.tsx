'use client'

import { createDocument } from '@aim/template-core'
import {
  IntegratedPreview,
  MultiVendorPreview,
  TemplatePreview,
  type PreviewMode,
} from '@aim/template-preview'
import { LAYOUTS, VENDOR_LIST, type Protocol } from '@aim/template-schema'
import { useMemo, useState } from 'react'
import { buildSampleTemplatesLite } from './samples'

/** 首页 Hero：切换示例模板 */
export function HeroPreview() {
  const docs = useMemo(() => buildSampleTemplatesLite(), [])
  const [i, setI] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3">
      <TemplatePreview
        document={docs[i % docs.length]}
        vendor="huawei"
        width={300}
        paramDisplay="example"
        showTime={false}
      />
      <div className="flex gap-1.5">
        {docs.map((d, idx) => (
          <button
            key={d.id}
            type="button"
            aria-label={d.name}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i % docs.length ? 'bg-fd-primary w-5' : 'bg-fd-muted-foreground/30 w-1.5'}`}
          />
        ))}
      </div>
    </div>
  )
}

/** 版式实时预览（MDX：<LayoutPreview layout="com.hbm.imageandtext" />） */
export function LayoutPreview({
  layout,
  mode = 'phone',
  protocol = 'aim',
  vendor = 'huawei',
  width = 280,
}: {
  layout: string
  mode?: PreviewMode
  protocol?: Protocol
  vendor?: string
  width?: number
}) {
  const doc = useMemo(() => createDocument({ layoutId: layout, name: '示例', now: 0 }), [layout])
  return (
    <div className="demo-grid not-prose bg-fd-card my-6 flex justify-center rounded-xl border py-6">
      <TemplatePreview
        document={doc}
        mode={mode}
        protocol={protocol}
        vendor={vendor}
        width={width}
        paramDisplay="token"
        showTime={false}
        ignoreVendorSupport
      />
    </div>
  )
}

/** 可交互 Playground：切换版式 / 厂商 / 模式 / 协议 */
export function PreviewPlayground() {
  const [layout, setLayout] = useState('com.hbm.imageandtext')
  const [vendor, setVendor] = useState('huawei')
  const [mode, setMode] = useState<PreviewMode>('phone')
  const [protocol, setProtocol] = useState<Protocol>('aim')
  const [log, setLog] = useState('点击预览中的按钮查看事件')
  const doc = useMemo(() => createDocument({ layoutId: layout, name: '示例', now: 0 }), [layout])
  const select = 'rounded-md border bg-fd-background px-2 py-1 text-sm'
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border">
      <div className="bg-fd-muted/40 flex flex-wrap items-center gap-2 border-b p-3">
        <select
          className={select}
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          aria-label="版式"
        >
          {LAYOUTS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          aria-label="厂商"
        >
          {VENDOR_LIST.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={mode}
          onChange={(e) => setMode(e.target.value as PreviewMode)}
          aria-label="模式"
        >
          {(['phone', 'bare', 'fluid', 'thumbnail'] as const).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          className={select}
          value={protocol}
          onChange={(e) => setProtocol(e.target.value as Protocol)}
          aria-label="协议"
        >
          {(['aim', 'rcs', 'rms'] as const).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="demo-grid bg-fd-card flex flex-col items-center gap-3 py-6">
        <TemplatePreview
          document={doc}
          vendor={vendor}
          mode={mode}
          protocol={protocol}
          width={mode === 'phone' ? 300 : 340}
          paramDisplay="token"
          showTime={false}
          onAction={(e) =>
            setLog(
              `onAction → ${e.event.action} ${String(e.event.target ?? '')}（${e.label ?? e.element?.type}）`,
            )
          }
        />
        <code className="bg-fd-muted rounded px-2 py-1 text-xs">{log}</code>
      </div>
    </div>
  )
}

export function MultiVendorDemo({ layout = 'com.hbm.imageandtext' }: { layout?: string }) {
  const doc = useMemo(() => createDocument({ layoutId: layout, name: '示例', now: 0 }), [layout])
  return (
    <div className="not-prose bg-fd-card my-6 rounded-xl border p-4">
      <MultiVendorPreview document={doc} phoneWidth={200} paramDisplay="token" showTime={false} />
    </div>
  )
}

export function IntegratedDemo({ layout = 'com.hbm.imageandtext' }: { layout?: string }) {
  const doc = useMemo(
    () =>
      buildSampleTemplatesLite().find((d) => d.layoutId === layout) ??
      createDocument({ layoutId: layout, now: 0 }),
    [layout],
  )
  return (
    <div className="demo-grid not-prose bg-fd-card my-6 flex justify-center rounded-xl border py-6">
      <IntegratedPreview document={doc} width={300} paramDisplay="example" showTime={false} />
    </div>
  )
}
