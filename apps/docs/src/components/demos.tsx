'use client'

import { createDocument } from '@aim/template-core'
import {
  IntegratedPreview,
  MultiVendorPreview,
  TemplatePreview,
  type PreviewMode,
} from '@aim/template-preview'
import { LAYOUTS, VENDOR_LIST, type Protocol } from '@aim/template-schema'
import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildSampleTemplatesLite } from './samples'

/** 首页 Hero：切换示例模板 */
export function HeroPreview() {
  const docs = useMemo(() => buildSampleTemplatesLite(), [])
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setI((v) => v + 1), 4000)
    return () => clearInterval(t)
  }, [paused])
  const current = docs[i % docs.length]
  return (
    <div
      className="flex flex-col items-center gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <TemplatePreview
        document={current}
        vendor="huawei"
        width={300}
        paramDisplay="example"
        showTime={false}
      />
      <div className="text-fd-muted-foreground text-xs">{current?.name}</div>
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

function PlaygroundField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-fd-muted-foreground text-xs">{label}</span>
      {children}
    </label>
  )
}

function NativeSelect({
  value,
  onChange,
  children,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  'aria-label': string
}) {
  return (
    <span className="relative inline-flex">
      <select
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-fd-background hover:border-fd-primary/50 focus-visible:ring-fd-primary/30 h-8 min-w-28 appearance-none rounded-md border py-0 pr-8 pl-2.5 text-sm transition outline-none focus-visible:ring-2"
      >
        {children}
      </select>
      <ChevronDownIcon className="text-fd-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
    </span>
  )
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <span className="bg-fd-background inline-flex h-8 items-center gap-0.5 rounded-md border p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={`h-full rounded px-2.5 text-xs transition ${
            v === value
              ? 'bg-fd-primary text-fd-primary-foreground'
              : 'text-fd-muted-foreground hover:text-fd-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </span>
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
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border">
      <div className="bg-fd-muted/40 flex flex-wrap items-end gap-x-4 gap-y-3 border-b p-3">
        <PlaygroundField label="版式">
          <NativeSelect value={layout} onChange={setLayout} aria-label="版式">
            {LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </NativeSelect>
        </PlaygroundField>
        <PlaygroundField label="厂商">
          <NativeSelect value={vendor} onChange={setVendor} aria-label="厂商">
            {VENDOR_LIST.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </NativeSelect>
        </PlaygroundField>
        <PlaygroundField label="模式 mode">
          <Seg
            value={mode}
            onChange={setMode}
            options={[
              ['phone', '手机'],
              ['bare', '卡片'],
              ['fluid', '自适应'],
              ['thumbnail', '缩略图'],
            ]}
          />
        </PlaygroundField>
        <PlaygroundField label="协议 protocol">
          <Seg
            value={protocol}
            onChange={setProtocol}
            options={[
              ['aim', '阅信'],
              ['rcs', '5G 消息'],
              ['rms', '视频短信'],
            ]}
          />
        </PlaygroundField>
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
