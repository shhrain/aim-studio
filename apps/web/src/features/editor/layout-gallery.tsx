'use client'
import { appPath } from '@/lib/platform'
import { useEditorCopy } from '@/features/editor/lib/copy'

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
  const ec = useEditorCopy()

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
            {ec('e16b38790d5')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href={appPath('templates')}>
              <ArrowLeftIcon />
              {ec('e65e433b24d')}
            </Link>
          </Button>
        )}
        <div className="bg-border h-5 w-px" />
        <div>
          <h1 className="text-[15px] font-semibold">
            {current ? ec('eaf730b7418') : ec('e607e78969b')}
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
              label: ec(TEMPLATE_CATEGORY_LABEL[c]),
            }))}
          />
          <Input
            className="w-60"
            placeholder={ec('e2e70821ea1')}
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
              {ec(g.label)}
              <span className="text-xs">{g.layouts.length}</span>
            </a>
          ))}
          <div className="text-muted-foreground mt-6 rounded-lg border border-dashed p-3 text-xs leading-relaxed">
            <SparklesIcon className="text-primary mb-1 size-4" />
            {ec('eeaf31e8e9b')}
          </div>
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-6 pb-10">
          {groups.map((g) => (
            <section key={g.key} id={`group-${g.key}`} className="pt-6">
              <h2 className="text-foreground/80 mb-3 text-sm font-semibold">{ec(g.label)}</h2>
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
  const ec = useEditorCopy()

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
          {active ? ec('e6135797735') : ec('ecdfd0b34e4')}
          <ArrowRightIcon className="size-3.5" />
        </span>
      </div>
      <div className="space-y-1.5 border-t px-3.5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{ec(layout.name)}</span>
          {layout.isNew && <Badge variant="soft">{ec('e3cc493bc5b')}</Badge>}
          {layout.protocols.includes('rcs') && <Badge variant="success">{ec('ee0b0e8a473')}</Badge>}
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs">
          {ec(layout.description)}
        </p>
        <p className="text-muted-foreground/80 text-[11px]">
          {ec('ed93373f813')}
          {layout.vendors.length} {ec('ecad10bb229')}
        </p>
      </div>
    </button>
  )
}
