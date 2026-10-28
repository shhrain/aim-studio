'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { platform } from '@/lib/platform'
import { PlatformBrand } from '@/components/platform-brand'
export function InvitePage({ token }: { token: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="platform onboarding">
      <PlatformBrand locale={locale} />
      <section className="panel">
        <h1>{t('acceptInvite')}</h1>
        <p>{t('inviteHint')}</p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const result = await platform.post<{ workspaceId: string }>(
                `/api/v1/invitations/${token}/accept`,
              )
              router.replace(`/${locale}/app/w/${result.workspaceId}`)
            } catch {
              setError(t('invalidInvite'))
            } finally {
              setBusy(false)
            }
          }}
        >
          {t('acceptInvite')}
        </button>
        <Link
          className="button subtle"
          href={`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/invite/${token}`)}`}
        >
          {t('login')}
        </Link>
      </section>
    </div>
  )
}
