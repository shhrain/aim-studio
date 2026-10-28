import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
const intl = createMiddleware({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  localePrefix: 'always',
})
export function proxy(request: NextRequest) {
  if (/^\/(templates|editor|gallery|m)(\/|$)/.test(request.nextUrl.pathname))
    return NextResponse.next()
  const response = intl(request)
  response.headers.set('x-aim-locale', request.nextUrl.pathname.startsWith('/en') ? 'en' : 'zh-CN')
  return response
}
export const config = { matcher: ['/((?!api|m/|_next|.*\\..*).*)'] }
