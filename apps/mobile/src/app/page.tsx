import { ArrowRightIcon, LayersIcon, QrCodeIcon, SearchCheckIcon, SendIcon } from 'lucide-react'
import Link from 'next/link'

const ENTRIES = [
  {
    href: '/template-list',
    title: '已发布模板',
    desc: '浏览工作空间模板与三协议预览',
    icon: SendIcon,
    tone: 'from-blue-500 to-indigo-500',
  },
  {
    href: '/scan-experience',
    title: '扫码体验',
    desc: '扫码打开模板预览与模拟流程',
    icon: QrCodeIcon,
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/ability-query',
    title: '能力查询',
    desc: '查看当前通道的终端能力结果',
    icon: SearchCheckIcon,
    tone: 'from-amber-500 to-orange-500',
  },
  {
    href: '/template-list?integrated=1',
    title: '三信融合',
    desc: '阅信 / 5G 消息 / 视频短信',
    icon: LayersIcon,
    tone: 'from-fuchsia-500 to-pink-500',
  },
]

export default function Home() {
  return (
    <main className="bg-muted mx-auto min-h-dvh max-w-screen-sm">
      <section className="hero-gradient relative overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-12 text-white">
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
        <div className="absolute top-24 -right-4 size-20 rounded-full bg-white/10" />
        <p className="text-sm opacity-80">AIM Studio</p>
        <h1 className="mt-1 text-xl leading-tight font-bold">移动体验中心</h1>
        <p className="mt-2 max-w-64 text-sm opacity-90">
          短信升级为富媒体卡片：图文、视频、卡券、通知，一条短信即是一个服务入口。
        </p>
      </section>
      <section className="-mt-10 grid grid-cols-2 gap-3 px-4 pb-8">
        {ENTRIES.map(({ href, title, desc, icon: Icon, tone }) => (
          <Link
            key={title}
            href={href}
            className="bg-card shadow-panel relative flex flex-col gap-2 rounded-xl p-4 transition active:scale-[0.98]"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-sm`}
            >
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-muted-foreground text-xs leading-relaxed">{desc}</span>
            <ArrowRightIcon className="text-muted-foreground/60 absolute top-4 right-4 size-4" />
          </Link>
        ))}
        <Link
          href="/ability-guide"
          className="bg-card shadow-panel col-span-2 flex items-center justify-between rounded-xl px-4 py-3.5 text-sm"
        >
          <span>
            <span className="font-medium">使用帮助</span>
            <span className="text-muted-foreground ml-1">查看厂商能力与设备设置指引</span>
          </span>
          <ArrowRightIcon className="text-muted-foreground size-4" />
        </Link>
      </section>
    </main>
  )
}
