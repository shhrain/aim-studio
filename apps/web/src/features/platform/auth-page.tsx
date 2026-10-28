'use client'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react'
import { authentication } from '@/lib/platform'
import { safeRedirect } from '@aim/api-contracts'
import { PlatformBrand } from '@/components/platform-brand'
import { Preferences } from '@/components/preferences'
export function AuthPage({
  mode,
}: {
  mode: 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password'
}) {
  const t = useTranslations()
  const locale = useLocale()
  const query = useSearchParams()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const title = {
    login: 'login',
    register: 'register',
    'verify-email': 'verify',
    'forgot-password': 'forgot',
    'reset-password': 'reset',
  }[mode]
  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? query.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'login') {
        await authentication.signIn(email, password)
        router.replace(safeRedirect(query.get('redirect'), `/${locale}/app`))
        router.refresh()
      }
      if (mode === 'register') {
        if (password !== form.get('confirm')) throw new Error(t('passwordMismatch'))
        await authentication.signUp(
          String(form.get('name')),
          email,
          password,
          `${location.origin}/${locale}/app`,
        )
        router.replace(`/${locale}/verify-email?email=${encodeURIComponent(email)}`)
      }
      if (mode === 'verify-email') {
        await authentication.sendVerification(email, `${location.origin}/${locale}/app`)
        setMessage(t('sent'))
      }
      if (mode === 'forgot-password') {
        await authentication.forgotPassword(email, `${location.origin}/${locale}/reset-password`)
        setMessage(t('sent'))
      }
      if (mode === 'reset-password') {
        await authentication.resetPassword(query.get('token') ?? '', password)
        router.replace(`/${locale}/login`)
      }
    } catch (err) {
      setError(locale === 'en' ? t('error') : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="platform auth-page">
      <header className="auth-header">
        <PlatformBrand locale={locale} />
        <Preferences />
      </header>
      <main className="auth-grid">
        <aside className="auth-story">
          <span className="eyebrow">AIM STUDIO / {t('workspace')}</span>
          <h1>{t('hero')}</h1>
          <p>{t('intro')}</p>
          <ol className="auth-workflow">
            {[1, 2, 3, 4].map((step) => (
              <li key={step}>
                <span>0{step}</span>
                {t(`step${step}`)}
              </li>
            ))}
          </ol>
          <span className="auth-trust">
            <ShieldCheck size={18} />
            {t('capability3')}
          </span>
        </aside>
        <section className="auth-card">
          <Link className="back-link" href={`/${locale}`}>
            <ArrowLeft size={16} />
            {t('back')}
          </Link>
          <h2>{t(title)}</h2>
          <p className="muted">
            {t(mode === 'register' ? 'terms' : mode === 'verify-email' ? 'sent' : 'loginHint')}
          </p>
          <form onSubmit={handle}>
            {mode === 'register' && (
              <label>
                {t('name')}
                <input name="name" autoComplete="name" required maxLength={80} />
              </label>
            )}
            {mode !== 'reset-password' && (
              <label>
                {t('email')}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={query.get('email') ?? ''}
                  required
                />
              </label>
            )}
            {['login', 'register', 'reset-password'].includes(mode) && (
              <label>
                {t('password')}
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'login' ? 1 : 12}
                  maxLength={128}
                  required
                />
              </label>
            )}
            {mode === 'register' && (
              <label>
                {t('confirmPassword')}
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </label>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="form-success">
                {message}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? t('loading') : t(mode === 'verify-email' ? 'resend' : title)}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="auth-links">
            {mode === 'login' ? (
              <>
                <Link href={`/${locale}/register`}>{t('register')}</Link>
                <Link href={`/${locale}/forgot-password`}>{t('forgot')}</Link>
              </>
            ) : (
              <Link href={`/${locale}/login`}>{t('backLogin')}</Link>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
