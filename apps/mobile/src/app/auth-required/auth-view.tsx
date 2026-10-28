'use client'
import { useSearchParams } from 'next/navigation'
export function AuthView() {
  const q = useSearchParams()
  const redirect = q.get('redirect') ?? '/m/template-list'
  const locale =
    typeof document !== 'undefined' && document.cookie.includes('NEXT_LOCALE=en') ? 'en' : 'zh-CN'
  const origin = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-8">
      <h1 className="text-2xl font-semibold">登录 AIM Studio</h1>
      <p className="text-muted-foreground">使用邮箱账号登录后，在工作空间中体验已发布模板。</p>
      <a
        className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-center"
        href={`${origin}/${locale}/login?redirect=` + encodeURIComponent(redirect)}
      >
        登录 / 注册
      </a>
    </main>
  )
}
