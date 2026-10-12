'use client'

import { createDocument } from '@aim/template-core'
import { TemplateThumbnail } from '@aim/template-preview'
import {
  LAYOUT_GROUPS,
  LAYOUTS,
  TEMPLATE_CATEGORY_LABEL,
  groupLayouts,
  type LayoutDefinition,
  type TemplateCategory,
} from '@aim/template-schema'
import { Badge, Button, Input, Segmented, cn } from '@aim/ui'
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, SparklesIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const previewCache = new Map<string, ReturnType<typeof createDocument>>()
function previewDoc(layoutId: string) {
  if (!previewCache.has(layoutId))
    previewCache.set(layoutId, createDocument({ layoutId, name: '预览', now: 0 }))
  return previewCache.get(layoutId)!
}

export function LayoutGallery({
  onPick,
  onClose,
  current,
}: {
  onPick: (layout: LayoutDefinition) => void
  onClose?: () => void
  current?: string
}) {
  const [category, setCategory] = useState<TemplateCategory>('service')
  const [keyword, setKeyword] = useState('')
  const groups = useMemo(() => {
    if (!keyword.trim()) return groupLayouts(category)
    const k = keyword.trim()
    const hits = LAYOUTS.filter(
      (l) =>
        l.name.includes(k) || l.description.includes(k) || LAYOUT_GROUPS[l.group].label.includes(k),
    )
    return [{ key: 'search', label: `搜索结果（${hits.length}）`, layouts: hits }]
  }, [category, keyword])

  return (
    <div className="bg-background flex h-dvh flex-col">
      <header className="bg-card flex h-14 shrink-0 items-center gap-4 border-b px-5">
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeftIcon />
            返回编辑
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">
              <ArrowLeftIcon />
              我的模板
            </Link>
          </Button>
        )}
        <div className="bg-border h-5 w-px" />
        <div>
          <h1 className="text-[15px] font-semibold">
            {current ? '更换版式' : '选择版式，开始创作'}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Segmented
            value={category}
            onValueChange={(v) => {
              setCategory(v)
              setKeyword('')
            }}
            options={(['service', 'notify'] as const).map((c) => ({
              value: c,
              label: TEMPLATE_CATEGORY_LABEL[c],
            }))}
          />
          <Input
            className="w-60"
            placeholder="搜索版式，如：轮播、红包"
            prefix={<SearchIcon className="size-4" />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="bg-sidebar hidden w-48 shrink-0 border-r p-3 lg:block">
          {groups.map((g) => (
            <a
              key={g.key}
              href={`#group-${g.key}`}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2 text-sm"
            >
              {g.label}
              <span className="text-xs">{g.layouts.length}</span>
            </a>
          ))}
          <div className="text-muted-foreground mt-6 rounded-lg border border-dashed p-3 text-xs leading-relaxed">
            <SparklesIcon className="text-primary mb-1 size-4" />
            标有「三信融合」的版式可同时下发 AIM / 5G 消息 / 视频短信，覆盖安卓、苹果与其他终端。
          </div>
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-6 pb-10">
          {groups.map((g) => (
            <section key={g.key} id={`group-${g.key}`} className="pt-6">
              <h2 className="text-foreground/80 mb-3 text-sm font-semibold">{g.label}</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
                {g.layouts.map((layout) => (
                  <LayoutCard
                    key={layout.id}
                    layout={layout}
                    active={layout.id === current}
                    onPick={() => onPick(layout)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function LayoutCard({
  layout,
  active,
  onPick,
}: {
  layout: LayoutDefinition
  active?: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'group bg-card shadow-panel hover:border-primary/40 hover:shadow-float focus-visible:ring-ring flex flex-col overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:outline-none',
        active && 'border-primary ring-primary/20 ring-2',
      )}
    >
      <div className="canvas-grid relative h-[230px] overflow-hidden px-5 pt-4">
        <TemplateThumbnail document={previewDoc(layout.id)} paramDisplay="token" />
        <div className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t to-transparent" />
        <span className="bg-primary text-primary-foreground absolute right-3 bottom-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium opacity-0 shadow-lg transition group-hover:opacity-100">
          {active ? '当前版式' : '使用'}
          <ArrowRightIcon className="size-3.5" />
        </span>
      </div>
      <div className="space-y-1.5 border-t px-3.5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{layout.name}</span>
          {layout.isNew && <Badge variant="soft">新</Badge>}
          {layout.protocols.includes('rcs') && <Badge variant="success">三信融合</Badge>}
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs">{layout.description}</p>
        <p className="text-muted-foreground/80 text-[11px]">支持 {layout.vendors.length} 个厂商</p>
      </div>
    </button>
  )
}
