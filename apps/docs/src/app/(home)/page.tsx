import { ACTION_TYPES, ELEMENT_TYPES, LAYOUTS, VENDOR_IDS } from '@aim/template-schema'
import {
  ArrowRightIcon,
  BookOpenIcon,
  BotIcon,
  BoxesIcon,
  CompassIcon,
  FileCode2Icon,
  LayersIcon,
  PenToolIcon,
  RocketIcon,
  ShuffleIcon,
  SmartphoneIcon,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { HeroPreview } from '@/components/demos'
import { appUrls } from '@/lib/layout.shared'

const GUIDES: { href: string; title: string; desc: string; icon: LucideIcon }[] = [
  {
    href: '/docs/getting-started',
    title: '快速开始',
    desc: '安装依赖、启动主站、服务端与移动端',
    icon: RocketIcon,
  },
  {
    href: '/docs/product/editor',
    title: '编辑器指南',
    desc: '版式选择、画布编辑、参数、预检与提交审核',
    icon: CompassIcon,
  },
  {
    href: '/docs/spec/layouts',
    title: '模板规范',
    desc: '版式、槽位字数、点击事件、厂商矩阵（由 schema 生成）',
    icon: LayersIcon,
  },
  {
    href: '/docs/sdk',
    title: '预览 SDK',
    desc: 'React / Next.js / 移动端 / iframe / Web Component 接入',
    icon: BoxesIcon,
  },
  {
    href: '/docs/protocol/integrated',
    title: '三信融合',
    desc: 'AIM → RCS / RMS 字段映射与降级规则',
    icon: ShuffleIcon,
  },
  {
    href: '/docs/ai',
    title: 'AI 协作',
    desc: '开箱即用的提示词、Cursor 规则与 llms.txt',
    icon: BotIcon,
  },
]

const APPS: { href: string; title: string; desc: string; icon: LucideIcon }[] = [
  {
    href: appUrls.editor,
    title: '模板编辑器',
    desc: '选版式、填槽位、配事件，多厂商预览后提交审核',
    icon: PenToolIcon,
  },
  {
    href: appUrls.mobile,
    title: '移动端体验',
    desc: '浏览已发布版本、多端预览与模拟任务',
    icon: SmartphoneIcon,
  },
  {
    href: appUrls.storybook,
    title: 'Storybook',
    desc: '组件库与「版式 × 厂商 × 协议」预览矩阵',
    icon: BookOpenIcon,
  },
].filter((app) => Boolean(app.href))

const SNIPPET = `import { TemplatePreview } from '@aim/template-preview'
import '@aim/template-preview/styles.css'

<TemplatePreview
  document={doc}
  vendor="huawei"     // 8 种厂商皮肤
  protocol="aim"      // aim | rcs | rms
  mode="phone"        // phone | bare | fluid | thumbnail
/>`

export default function HomePage() {
  const stats = [
    [LAYOUTS.filter((l) => !l.free).length, '标准版式'],
    [ELEMENT_TYPES.length, '元素类型'],
    [ACTION_TYPES.length, '点击事件'],
    [VENDOR_IDS.length, '厂商皮肤'],
  ] as const
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b">
        <div className="demo-grid text-fd-foreground pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_70%_at_30%_40%,black,transparent)]" />
        <div className="from-fd-primary/12 pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-radial to-transparent to-70%" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_320px] lg:py-20">
          <div>
            <span className="bg-fd-primary/10 text-fd-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <span className="bg-fd-primary size-1.5 rounded-full" />
              5G 阅信模板平台
            </span>
            <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
              一份模板，
              <br />
              <span className="from-fd-primary bg-linear-to-r to-sky-500 bg-clip-text text-transparent">
                安卓 / 苹果 / 全终端可达
              </span>
            </h1>
            <p className="text-fd-muted-foreground mt-5 max-w-xl leading-relaxed">
              AIM Studio 提供模板协议、编辑器、全场景预览 SDK 与三信融合转换。所有能力以 Monorepo
              包的形式沉淀，可被任何业务系统与 AI Agent 直接复用。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/docs/getting-started"
                className="bg-fd-primary text-fd-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition hover:opacity-90"
              >
                开始阅读
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link
                href="/docs/sdk"
                className="bg-fd-background hover:bg-fd-accent inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-medium transition"
              >
                接入预览 SDK
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-4 divide-x">
              {stats.map(([n, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <dt className="text-3xl font-semibold tabular-nums">{n}</dt>
                  <dd className="text-fd-muted-foreground mt-1 text-xs">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <SectionTitle
          title="从这里开始"
          desc="按角色挑选入口：产品与运营看指南，研发看规范与 SDK。"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group bg-fd-card hover:border-fd-primary/40 rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="bg-fd-primary/10 text-fd-primary flex size-9 items-center justify-center rounded-lg">
                <c.icon className="size-[18px]" />
              </span>
              <h3 className="mt-4 flex items-center gap-1 font-semibold">
                {c.title}
                <ArrowRightIcon className="text-fd-primary size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="text-fd-muted-foreground mt-1 text-sm leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-fd-muted/40 border-y">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-2">
          <div>
            <SectionTitle
              title="三行代码，任意宿主渲染"
              desc="预览 SDK 只依赖 React，样式自带 aim- 前缀与 CSS 变量；用容器单位按宽度等比缩放，从缩略图到真机尺寸都清晰。"
            />
            <ul className="text-fd-muted-foreground space-y-2 text-sm">
              {[
                '编辑器画布、移动端详情、列表缩略图、扫码预览共用同一渲染器',
                '支持 iframe 嵌入与 Web Component，非 React 项目同样可用',
                '同一份文档实时转换为 5G 消息 / 视频短信，提前看到降级效果',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <FileCode2Icon className="text-fd-primary mt-0.5 size-4 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <pre className="bg-fd-card overflow-x-auto rounded-xl border p-5 text-[13px] leading-relaxed shadow-sm">
            <code>{SNIPPET}</code>
          </pre>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <SectionTitle title="配套应用" desc="本地启动后即可体验，接口全部由 MSW Mock 提供。" />
        <div className="grid gap-4 md:grid-cols-3">
          {APPS.map((a) => (
            <a
              key={a.title}
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="bg-fd-card hover:border-fd-primary/40 flex items-start gap-4 rounded-xl border p-5 transition hover:shadow-lg"
            >
              <span className="bg-fd-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <a.icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{a.title}</span>
                <span className="text-fd-muted-foreground mt-1 block text-sm leading-relaxed">
                  {a.desc}
                </span>
                <span className="text-fd-muted-foreground/80 mt-2 block font-mono text-xs">
                  {a.href.replace(/^https?:\/\//, '')}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <footer className="text-fd-muted-foreground border-t py-8 text-center text-xs">
        AIM Studio · 5G 阅信模板平台 · 文档由 schema 自动生成规范章节
      </footer>
    </main>
  )
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-fd-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
