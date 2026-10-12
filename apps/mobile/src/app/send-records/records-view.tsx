'use client'

import { MESSAGE_TYPE_LABEL, type SendRecord, type SendStatus } from '@aim/api-client'
import { TemplatePreview } from '@aim/template-preview'
import { VENDORS } from '@aim/template-schema'
import { Badge, Button, Empty, Input, Skeleton, cn } from '@aim/ui'
import { BottomSheet, NavBar, PullRefresh } from '@aim/ui/mobile'
import { formatDate } from '@aim/utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { InfoIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useState } from 'react'
import { AppTabBar } from '@/components/app-tabbar'
import { SendFlow } from '@/components/send-flow'
import { api } from '@/lib/api'
import { getPhone } from '@/lib/auth'

const STATUS: Record<SendStatus, { label: string; variant: 'success' | 'destructive' | 'info' }> = {
  SUCCESS: { label: '发送成功', variant: 'success' },
  FAILED: { label: '发送失败', variant: 'destructive' },
  SENDING: { label: '发送中', variant: 'info' },
}
const RANGES = [
  { key: '7', label: '近7天' },
  { key: '30', label: '近30天' },
  { key: 'all', label: '全部' },
]

export function RecordsView() {
  const router = useRouter()
  const whois = getPhone()
  const [keyword, setKeyword] = useState('')
  const mobile = useDeferredValue(keyword)
  const [range, setRange] = useState('30')
  const [status, setStatus] = useState<SendStatus | undefined>()
  const [previewing, setPreviewing] = useState<SendRecord | null>(null)
  const [resend, setResend] = useState<SendRecord | null>(null)
  const startDate =
    range === 'all' ? undefined : formatDate(Date.now() - Number(range) * 86_400_000, 'YYYY-MM-DD')
  const q = { whois, mobile: mobile || undefined, startDate, status }
  const list = useInfiniteQuery({
    queryKey: ['experience', 'records', q],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.sendDetail({ ...q, pageNum: pageParam, pageSize: 10 }),
    getNextPageParam: (last) => (last.current < last.pages ? last.current + 1 : undefined),
  })
  const records = list.data?.pages.flatMap((p) => p.records) ?? []
  const detail = useQuery({
    queryKey: ['experience', 'detail', resend?.tplId ?? previewing?.tplId],
    queryFn: () => api.templateDetail((resend ?? previewing)!.tplId),
    enabled: Boolean(resend ?? previewing),
  })

  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="发送记录" onBack={() => router.push('/template-list')} />
      <div className="bg-muted/95 sticky top-[calc(44px+env(safe-area-inset-top))] z-20 space-y-2 px-3 py-2.5 backdrop-blur">
        <Input
          prefix={<SearchIcon className="size-4" />}
          placeholder="搜索手机号"
          inputMode="numeric"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value.replace(/\D/g, ''))}
          className="bg-card"
        />
        <div className="flex gap-2 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                'h-7 shrink-0 rounded-full px-3 text-xs',
                range === r.key ? 'bg-primary text-primary-foreground' : 'bg-card',
              )}
            >
              {r.label}
            </button>
          ))}
          <span className="bg-border mx-1 w-px" />
          {(Object.keys(STATUS) as SendStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(status === s ? undefined : s)}
              className={cn(
                'h-7 shrink-0 rounded-full px-3 text-xs',
                status === s ? 'bg-foreground text-background' : 'bg-card',
              )}
            >
              {STATUS[s].label}
            </button>
          ))}
        </div>
      </div>
      <PullRefresh onRefresh={() => list.refetch()}>
        <div className="space-y-2.5 px-3 pb-4">
          {list.isLoading ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : records.length === 0 ? (
            <Empty
              title="暂无发送记录"
              description="去模板列表挑选一个模板，发送到手机体验吧"
              action={
                <Button size="sm" asChild>
                  <Link href="/template-list">去体验</Link>
                </Button>
              }
            />
          ) : (
            records.map((r) => (
              <article key={r.id} className="bg-card shadow-panel rounded-xl p-3.5">
                <header className="flex items-center gap-2">
                  <span className="line-clamp-1 flex-1 font-medium">{r.tplName}</span>
                  <Badge variant={STATUS[r.status].variant} dot>
                    {STATUS[r.status].label}
                  </Badge>
                </header>
                <dl className="mt-2 grid grid-cols-[64px_1fr] gap-y-1 text-xs">
                  <dt className="text-muted-foreground">接收号码</dt>
                  <dd className="tabular-nums">
                    {r.mobile}
                    {r.contactName && (
                      <span className="text-muted-foreground ml-1">{r.contactName}</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">消息形态</dt>
                  <dd className="flex items-center gap-1">
                    {MESSAGE_TYPE_LABEL[r.messageType]}
                    {r.degraded && (
                      <Badge variant="warning" className="text-[10px]">
                        由{MESSAGE_TYPE_LABEL[r.degraded.from]}降级
                      </Badge>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">终端</dt>
                  <dd>
                    {r.factory ? VENDORS[r.factory].name : '-'} · {r.carrier}
                  </dd>
                  <dt className="text-muted-foreground">发送时间</dt>
                  <dd>{formatDate(r.sendTime, 'YYYY-MM-DD HH:mm:ss')}</dd>
                </dl>
                {(r.failReason || r.degraded) && (
                  <p className="bg-muted text-muted-foreground mt-2 flex items-start gap-1 rounded-md px-2 py-1.5 text-xs">
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                    {r.failReason ?? r.degraded?.reason}
                    {r.degraded?.from === 1 && (
                      <Link
                        href={`/ability-guide${r.factory ? `?factory=${r.factory}` : ''}`}
                        className="text-primary ml-auto shrink-0"
                      >
                        开启指引
                      </Link>
                    )}
                  </p>
                )}
                <footer className="mt-2.5 flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => setPreviewing(r)}>
                    预览
                  </Button>
                  {r.status === 'FAILED' && (
                    <Button size="xs" onClick={() => setResend(r)}>
                      再发一次
                    </Button>
                  )}
                </footer>
              </article>
            ))
          )}
          {list.hasNextPage && (
            <Button
              block
              variant="ghost"
              loading={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              加载更多
            </Button>
          )}
        </div>
      </PullRefresh>
      <AppTabBar />
      <BottomSheet
        open={Boolean(previewing)}
        onOpenChange={(o) => !o && setPreviewing(null)}
        title="消息预览"
        description={
          previewing
            ? `${MESSAGE_TYPE_LABEL[previewing.messageType]} · ${previewing.mobile}`
            : undefined
        }
      >
        {detail.data && previewing && (
          <div className="overflow-hidden rounded-xl">
            <TemplatePreview
              document={detail.data.document}
              protocol={({ 1: 'aim', 2: 'rcs', 3: 'rms' } as const)[previewing.messageType]}
              vendor={previewing.factory}
              mode="fluid"
              paramDisplay="example"
              showTime={false}
            />
          </div>
        )}
      </BottomSheet>
      {resend && detail.data && (
        <SendFlow
          open
          onOpenChange={(o) => !o && setResend(null)}
          template={detail.data}
          initialMobiles={[resend.mobile]}
        />
      )}
    </div>
  )
}
