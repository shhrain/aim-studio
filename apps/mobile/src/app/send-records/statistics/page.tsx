'use client'

import { MESSAGE_TYPE_LABEL, type MessageType } from '@aim/api-client'
import { VENDORS, type VendorId } from '@aim/template-schema'
import { Button, Empty, Skeleton } from '@aim/ui'
import { CellGroup, Cell, NavBar } from '@aim/ui/mobile'
import { BarChart3Icon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppTabBar } from '@/components/app-tabbar'
import { hooks } from '@/lib/api'
import { getIdentity } from '@/lib/auth'

const TYPE_COLOR: Record<MessageType, string> = { 1: '#2f6bff', 2: '#16a34a', 3: '#f59e0b' }

function Pie({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  let acc = 0
  const stops = parts.map((p) => {
    const from = (acc / total) * 360
    acc += p.value
    return `${p.color} ${from}deg ${(acc / total) * 360}deg`
  })
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(',')})` }}
        role="img"
        aria-label="消息形态占比"
      >
        <div className="bg-card absolute inset-5 flex flex-col items-center justify-center rounded-full">
          <span className="text-xl font-semibold tabular-nums">
            {parts.reduce((s, p) => s + p.value, 0)}
          </span>
          <span className="text-muted-foreground text-[10px]">总条数</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            {p.label}
            <span className="text-muted-foreground ml-auto pl-3 tabular-nums">
              {p.value}（{Math.round((p.value / total) * 100)}%）
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StatisticsPage() {
  const router = useRouter()
  const { data, isLoading } = hooks.useStatistics(getIdentity())
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="模拟任务统计" onBack={() => router.push('/send-records')} />
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : !data || data.total === 0 ? (
        <div className="space-y-3 py-3">
          <div className="mx-3 grid grid-cols-3 gap-2">
            {['模拟条数', '模拟成功', '失败'].map((label) => (
              <div key={label} className="bg-card shadow-panel rounded-xl p-3 text-center">
                <div className="text-muted-foreground/60 text-2xl font-semibold tabular-nums">
                  0
                </div>
                <div className="text-muted-foreground text-xs">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-card shadow-panel mx-3 rounded-xl">
            <Empty
              className="px-6"
              icon={<BarChart3Icon />}
              title="还没有模拟任务数据"
              description="从已发布模板创建模拟任务。这里只汇总模拟处理记录，不代表真实消息送达。"
              action={
                <Button size="sm" asChild>
                  <Link href="/template-list">浏览模板</Link>
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-3">
          <div className="mx-3 grid grid-cols-3 gap-2">
            {[
              ['模拟条数', data.total, 'text-foreground'],
              ['模拟成功', data.byStatus.SUCCESS, 'text-success'],
              ['失败', data.byStatus.FAILED, 'text-destructive'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="bg-card shadow-panel rounded-xl p-3 text-center">
                <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
                <div className="text-muted-foreground text-xs">{label}</div>
              </div>
            ))}
          </div>
          <section className="bg-card shadow-panel mx-3 rounded-xl p-4">
            <h3 className="mb-3 text-sm font-medium">消息形态</h3>
            <Pie
              parts={([1, 2, 3] as MessageType[]).map((t) => ({
                label: MESSAGE_TYPE_LABEL[t],
                value: data.byType[t],
                color: TYPE_COLOR[t],
              }))}
            />
          </section>
          <CellGroup title="终端厂商分布">
            {data.byFactory.map((f) => (
              <Cell
                key={f.factory}
                title={VENDORS[f.factory as VendorId]?.name ?? '未知'}
                value={`${f.count} 条`}
              />
            ))}
          </CellGroup>
        </div>
      )}
      <AppTabBar />
    </div>
  )
}
