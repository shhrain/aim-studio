'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveCurrent } from '@/features/editor/lib/save'
import { useEditor } from '@/features/editor/store'
import { platform } from '@/lib/platform'
export function Preferences() {
  const locale = useLocale()
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const query = useSearchParams()
  useEffect(() => setMounted(true), [])
  const save = (body: object) => {
    void platform.put('/api/v1/me/preferences', body, { silent: true }).catch(() => undefined)
  }
  return (
    <div className="preferences">
      <select
        aria-label={t('theme')}
        value={mounted ? theme : 'system'}
        onChange={(e) => {
          setTheme(e.target.value)
          save({ theme: e.target.value })
        }}
      >
        <option value="system">{t('system')}</option>
        <option value="light">{t('light')}</option>
        <option value="dark">{t('dark')}</option>
      </select>
      <select
        aria-label={t('language')}
        value={locale}
        onChange={async (e) => {
          const next = e.target.value
          if (
            location.pathname.includes('/create/') &&
            ['dirty', 'saving', 'error'].includes(useEditor.getState().saveState) &&
            !(await saveCurrent())
          )
            return
          document.cookie = `NEXT_LOCALE=${next}; path=/; samesite=lax`
          save({ locale: next })
          router.replace(
            location.pathname.replace(/^\/(zh-CN|en)/, `/${next}`) +
              (query.size ? '?' + query.toString() : '') +
              location.hash,
          )
        }}
      >
        <option value="zh-CN">中文</option>
        <option value="en">English</option>
      </select>
    </div>
  )
}
