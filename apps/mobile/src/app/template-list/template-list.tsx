'use client'

import type { ExperienceTemplate, TemplateListQuery } from '@aim/api-client'
import { TemplateThumbnail } from '@aim/template-preview'
import { Badge, Button, Empty, ScrollRow, Skeleton, cn } from '@aim/ui'
import { BottomSheet, NavBar, PullRefresh } from '@aim/ui/mobile'
import { useInfiniteQuery } from '@tanstack/react-query'
import { FlameIcon, SlidersHorizontalIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppTabBar } from '@/components/app-tabbar'
import { VendorTags } from '@/components/vendor-tags'
import { getIdentity } from '@/lib/auth'
import { api, hooks } from '@/lib/api'

type Filters = Pick<
  TemplateListQuery,
  'industryIds' | 'styleIds' | 'labelIds' | 'carriers' | 'factories'
>
const PAGE_SIZE = 8

export function TemplateList() {
  const router = useRouter()
  const integratedOnly = useSearchParams().get('integrated') === '1'
  const [filters, setFilters] = useState<Filters>({})
  const [industry, setIndustry] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const options = hooks.useFilterOptions()
  const query = useMemo(
    () => ({
      ...filters,
      industryIds: industry === 'all' ? filters.industryIds : [industry],
      integrated: integratedOnly || undefined,
    }),
    [filters, industry, integratedOnly],
  )

  const list = useInfiniteQuery({
    queryKey: ['experience', getIdentity(), 'list', query],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api.templateList({ ...query, pageIndex: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (last, all) =>
      all.length * PAGE_SIZE < (last.pageInfo?.total ?? 0) ? all.length : undefined,
  })
  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) =>
        e?.isIntersecting &&
        list.hasNextPage &&
        !list.isFetchingNextPage &&
        void list.fetchNextPage(),
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [list])
  const activeCount = Object.values(filters).reduce((n, v) => n + (v?.length ?? 0), 0)

  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar
        title={integratedOnly ? '三信融合模板' : '模板体验'}
        onBack={() => router.push('/')}
        right={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex size-9 items-center justify-center"
            aria-label="筛选"
          >
            <SlidersHorizontalIcon className="size-5" />
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute top-1 right-0.5 min-w-4 rounded-full px-1 text-[10px] leading-4">
                {activeCount}
              </span>
            )}
          </button>
        }
      />
      <ScrollRow
        wrapperClassName="bg-muted/95 sticky top-[calc(44px+env(safe-area-inset-top))] z-20 backdrop-blur"
        className="gap-2 px-3 py-2.5"
      >
        {[{ id: 'all', name: '全部' }, ...(options.data?.industries ?? [])].map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => setIndustry(i.id)}
            className={cn(
              'h-7 shrink-0 rounded-full px-3 text-xs transition',
              industry === i.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground/80',
            )}
          >
            {i.name}
          </button>
        ))}
      </ScrollRow>
      <Link
        href="/ability-guide"
        className="bg-warning/15 text-warning-foreground mx-3 mb-2.5 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
      >
        收不到阅信？查看手机设置指引
        <span>›</span>
      </Link>
      <PullRefresh onRefresh={() => list.refetch()}>
        <div className="px-3">
          {list.isLoading ? (
            <div className="waterfall">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className={cn('rounded-xl', i % 2 ? 'h-56' : 'h-72')} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Empty
              title="暂无匹配的模板"
              description="换个筛选条件试试"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (setFilters({}), setIndustry('all'))}
                >
                  清除筛选
                </Button>
              }
            />
          ) : (
            <div className="waterfall">
              {items.map((t) => (
                <TemplateCard key={t.tplId} t={t} />
              ))}
            </div>
          )}
          <div ref={sentinel} className="text-muted-foreground py-4 text-center text-xs">
            {list.isFetchingNextPage
              ? '加载中…'
              : list.hasNextPage
                ? ''
                : items.length
                  ? '— 已经到底了 —'
                  : ''}
          </div>
        </div>
      </PullRefresh>
      <AppTabBar />
      <FilterSheet open={open} onOpenChange={setOpen} value={filters} onChange={setFilters} />
    </div>
  )
}

function TemplateCard({ t }: { t: ExperienceTemplate }) {
  return (
    <Link
      href={`/detail?tplId=${t.tplId}`}
      className="bg-card shadow-panel block overflow-hidden rounded-xl active:opacity-90"
    >
      <div className="max-h-80 overflow-hidden bg-[var(--aim-screen-bg,#f1f3f5)] p-2">
        <TemplateThumbnail document={t.document} vendor={t.factories[0]} paramDisplay="example" />
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="line-clamp-1 text-sm font-medium">{t.tplName}</div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="soft" className="text-[10px]">
            {t.styleName}
          </Badge>
          {t.integrated && (
            <Badge variant="success" className="text-[10px]">
              三信融合
            </Badge>
          )}
          {t.paramcnt > 0 && (
            <Badge variant="warning" className="text-[10px]">
              含变量
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <VendorTags vendors={t.factories} max={3} />
          {t.hot ? (
            <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
              <FlameIcon className="size-3 text-orange-500" />
              {t.hot}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function FilterSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  value: Filters
  onChange: (f: Filters) => void
}) {
  const { data } = hooks.useFilterOptions()
  const [draft, setDraft] = useState<Filters>(value)
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])
  const toggle = (key: keyof Filters, id: string) => {
    const list = (draft[key] as string[] | undefined) ?? []
    setDraft({ ...draft, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] })
  }
  const groups: { key: keyof Filters; label: string; options: { id: string; name: string }[] }[] = [
    { key: 'styleIds', label: '版式', options: data?.styles ?? [] },
    { key: 'labelIds', label: '标签', options: data?.labels ?? [] },
    { key: 'carriers', label: '运营商', options: data?.carriers ?? [] },
    { key: 'factories', label: '手机厂商', options: data?.factories ?? [] },
  ]
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="筛选模板"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDraft({})}>
            重置
          </Button>
          <Button
            className="flex-[2]"
            onClick={() => {
              onChange(draft)
              onOpenChange(false)
            }}
          >
            确定
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        {groups.map((g) => (
          <section key={g.key}>
            <h4 className="mb-2 text-sm font-medium">{g.label}</h4>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = ((draft[g.key] as string[] | undefined) ?? []).includes(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(g.key, o.id)}
                    className={cn(
                      'h-8 rounded-full border px-3 text-xs transition',
                      on ? 'border-primary bg-accent text-accent-foreground' : 'bg-muted/50',
                    )}
                  >
                    {o.name}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  )
}
