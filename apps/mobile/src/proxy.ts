import { NextResponse, type NextRequest } from 'next/server'
import { createHttpClient } from '@aim/api-client'
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/m(?=\/|$)/, '') || '/'
  if (
    ['/auth-required', '/ability-guide', '/preview', '/embed', '/api/health'].some(
      (p) => path === p || path.startsWith(p + '/'),
    )
  )
    return NextResponse.next()
  if (process.env.NEXT_PUBLIC_API_MOCK === 'true') return NextResponse.next()
  try {
    await createHttpClient({
      baseUrl: process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000',
      headers: { cookie: req.headers.get('cookie') ?? '' },
    }).get('/api/v1/me')
    return NextResponse.next()
  } catch {
    const locale = req.cookies.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'zh-CN'
    const origin =
      process.env.PUBLIC_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?redirect=` + encodeURIComponent('/m' + path + req.nextUrl.search),
        origin,
      ),
    )
  }
}
export const config = {
  matcher: ['/', '/((?!_next/|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json)$).*)'],
}
