'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ApiError } from '@aim/api-client'
import { messages, type Locale } from '@aim/i18n'
import { platform } from '@/lib/platform'

/** 旧链接不在语言路由内，从 Cookie 或浏览器语言恢复上次选择。 */
function readLocale(): Locale {
  if (typeof document === 'undefined') return 'zh-CN'
  const fromCookie = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)?.[1]
  const value = fromCookie ? decodeURIComponent(fromCookie) : navigator.language
  return value === 'en' || value.startsWith('en') ? 'en' : 'zh-CN'
}

/** 旧模板链接必须由服务端解析成员关系，不以模板 ID 授权。 */
export function LegacyEntry({ id }: { id?: string }) {
  const router = useRouter()
  const [locale] = useState<Locale>(readLocale)
  const [error, setError] = useState(false)
  const copy = messages[locale]

  useEffect(() => {
    const home = `/${locale}/app`
    if (!id || id === 'new') {
      router.replace(home)
      return
    }
    void platform
      .get<{ workspaceId: string }>(`/api/v1/resolve-template/${encodeURIComponent(id)}`)
      .then((result) =>
        router.replace(`/${locale}/app/w/${result.workspaceId}/create/${encodeURIComponent(id)}`),
      )
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.isUnauthorized) {
          router.replace(`/${locale}/login?redirect=${encodeURIComponent(location.pathname)}`)
        } else setError(true)
      })
  }, [id, locale, router])

  return (
    <main className="platform boot-state">
      <p>{error ? copy.templateMissing : copy.openWorkspace}</p>
      {error && (
        <Link className="button primary" href={`/${locale}/app`}>
          {copy.console}
        </Link>
      )}
    </main>
  )
}
