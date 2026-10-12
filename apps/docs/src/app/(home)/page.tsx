import { LAYOUTS, VENDOR_IDS, ELEMENT_TYPES, ACTION_TYPES } from '@aim/template-schema'
import Link from 'next/link'
import { HeroPreview } from '@/components/demos'

const CARDS = [
  { href: '/docs/getting-started', title: '快速开始', desc: '安装依赖、启动三个应用、了解仓库结构' },
  { href: '/docs/product/editor', title: '编辑器指南', desc: '版式选择、画布编辑、参数、预检与提交审核' },
  { href: '/docs/spec/layouts', title: '模板规范', desc: '版式、槽位字数、点击事件、厂商矩阵（由 schema 生成）' },
  { href: '/docs/sdk', title: '预览 SDK', desc: 'React / Next.js / 移动端 / iframe / Web Component 接入' },
  { href: '/docs/protocol/integrated', title: '三信融合', desc: 'AIM → RCS / RMS 字段映射与降级规则' },
  { href: '/docs/ai', title: 'AI 协作', desc: '开箱即用的提示词、规则与 llms.txt' },
]

export default function HomePage() {
  const stats = [
    [LAYOUTS.filter((l) => !l.free).length, '标准版式'],
    [ELEMENT_TYPES.length, '元素类型'],
    [ACTION_TYPES.length, '点击事件'],
    [VENDOR_IDS.length, '厂商皮肤'],
  ]
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-medium text-fd-primary">5G 阅信模板平台</p>
          <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight">一份模板，安卓 / 苹果 / 全终端可达</h1>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            AIM Studio 提供模板协议、编辑器、全场景预览 SDK 与三信融合转换。所有能力以 Monorepo 包的形式沉淀，可被任何业务系统与 AI Agent 直接复用。
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/docs/getting-started" className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground">
              开始阅读
            </Link>
            <Link href="/docs/sdk" className="rounded-lg border px-5 py-2.5 text-sm font-medium">
              接入预览 SDK
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-4 gap-4">
            {stats.map(([n, label]) => (
              <div key={label}>
                <dt className="text-3xl font-semibold tabular-nums">{n}</dt>
                <dd className="text-xs text-fd-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPreview />
      </section>
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl border bg-fd-card p-5 transition hover:border-fd-primary/50 hover:shadow-md">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-fd-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
