import { NextResponse, type NextRequest } from 'next/server'
import { PHONE_COOKIE, PUBLIC_PATHS, TOKEN_COOKIE } from './lib/auth'

const MAX_AGE = 7 * 24 * 3600

/**
 * 鉴权代理（Next.js 16 proxy，原 middleware）：
 * 1. 消费 URL 中的 token / phone（兼容 loginPhone），写入 Cookie 后重定向到干净地址
 * 2. 携带完整登录信息进入首页时直达模板列表（与原体验系统一致）
 * 3. 未登录访问受保护页面时跳转 /auth-required
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const token = url.searchParams.get('token')
  const phone = url.searchParams.get('phone') ?? url.searchParams.get('loginPhone')

  if (token) {
    url.searchParams.delete('token')
    url.searchParams.delete('phone')
    url.searchParams.delete('loginPhone')
    if (url.pathname === '/' && phone) url.pathname = '/template-list'
    const res = NextResponse.redirect(url)
    res.cookies.set(TOKEN_COOKIE, token, { path: '/', maxAge: MAX_AGE, sameSite: 'lax' })
    if (phone) res.cookies.set(PHONE_COOKIE, phone, { path: '/', maxAge: MAX_AGE, sameSite: 'lax' })
    return res
  }

  const isPublic = PUBLIC_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))
  if (!isPublic && !req.cookies.get(TOKEN_COOKIE)?.value) {
    const target = new URL('/auth-required', req.url)
    target.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(target)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/|favicon|mockServiceWorker.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json)$).*)',
  ],
}
