'use client'

import { MESSAGE_TYPE_LABEL, type MessageType } from '@aim/api-client'
import { VENDORS, type VendorId } from '@aim/template-schema'
import { Empty, Skeleton } from '@aim/ui'
import { CellGroup, Cell, NavBar } from '@aim/ui/mobile'
import { useRouter } from 'next/navigation'
import { AppTabBar } from '@/components/app-tabbar'
import { hooks } from '@/lib/api'
import { getPhone } from '@/lib/auth'

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
  const { data, isLoading } = hooks.useStatistics(getPhone())
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm">
      <NavBar title="发送统计" onBack={() => router.push('/send-records')} />
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : !data || data.total === 0 ? (
        <Empty title="暂无统计数据" description="完成一次测试发送后即可查看" />
      ) : (
        <div className="space-y-3 py-3">
          <div className="mx-3 grid grid-cols-3 gap-2">
            {[
              ['发送总数', data.total, 'text-foreground'],
              ['成功', data.byStatus.SUCCESS, 'text-success'],
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
