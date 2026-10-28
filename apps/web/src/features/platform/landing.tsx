'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUpRight, ArrowRight, Layers3, ShieldCheck, Users, Menu, Code2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@aim/ui'
import { PlatformBrand } from '@/components/platform-brand'
import { Preferences } from '@/components/preferences'
import { platform } from '@/lib/platform'
import Showcase from './landing-showcase'
const docs = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3002'

export function Landing() {
  const t = useTranslations()
  const locale = useLocale()
  const [logged, setLogged] = useState(false)
  const [menu, setMenu] = useState(false)
  const [sampleReady, setSampleReady] = useState(false)
  useEffect(() => {
    void platform
      .get('/api/v1/me', { silent: true })
      .then(() => setLogged(true))
      .catch(() => undefined)
  }, [])
  useEffect(() => setSampleReady(true), [])
  const entry = `/${locale}/${logged ? 'app' : 'register'}`

  return (
    <div className="platform landing">
      <header className="landing-header">
        <PlatformBrand locale={locale} />
        <nav
          id="landing-navigation"
          aria-label={t('menu')}
          className={menu ? 'landing-nav open' : 'landing-nav'}
        >
          <a href="#features" onClick={() => setMenu(false)}>
            {t('features')}
          </a>
          <a href="#examples" onClick={() => setMenu(false)}>
            {t('examples')}
          </a>
          <a href={docs}>
            {t('docs')}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <div className="nav-preferences">
            <Preferences />
          </div>
        </nav>
        <div className="header-actions">
          <Preferences />
          {!logged && (
            <Link className="button subtle" href={`/${locale}/login`}>
              {t('login')}
            </Link>
          )}
          <Button size="sm" asChild>
            <Link href={entry}>
              {t(logged ? 'console' : 'start')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <button
            className="icon-button mobile-menu"
            aria-label={t('menu')}
            aria-expanded={menu}
            aria-controls="landing-navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow">AIM STUDIO / {t('workspace')}</span>
            <h1>{t('hero')}</h1>
            <p>{t('intro')}</p>
            <div className="hero-actions">
              <Button asChild>
                <Link href={entry}>
                  {t(logged ? 'console' : 'start')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={docs}>
                  {t('docs')}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
            <dl className="hero-facts">
              <div>
                <dt>33 + 1</dt>
                <dd>{t('designLayouts')}</dd>
              </div>
              <div>
                <dt>AIM / RCS / RMS</dt>
                <dd>{t('designProtocols')}</dd>
              </div>
            </dl>
          </div>
          <section className="product-showcase" id="examples" aria-label={t('examples')}>
            {sampleReady ? <Showcase /> : null}
          </section>
        </section>
        <section className="landing-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">01 / {t('features')}</span>
            <h2>{t('designWorkflow')}</h2>
          </div>
          <div className="feature-list">
            {[Layers3, ShieldCheck, Users].map((Icon, i) => (
              <article className="feature-row" key={i}>
                <span className="feature-index">0{i + 1}</span>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <h3>{t(`capability${i + 1}`)}</h3>
                  <p>{t(`detail${i + 1}`)}</p>
                </div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </article>
            ))}
          </div>
          <ol className="steps-strip">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <span>0{i}</span>
                {t(`step${i}`)}
                {i < 4 && <ArrowRight size={16} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </section>
        <section className="developer-banner">
          <Code2 size={24} aria-hidden="true" />
          <div>
            <h2>{t('developer')}</h2>
            <p>{t('developerHint')}</p>
          </div>
          <Button variant="outline" asChild>
            <a href={`${docs}/docs`}>
              {t('apiDocs')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <div>
          <PlatformBrand locale={locale} />
          <p>{t('footer')}</p>
        </div>
        <a href={docs}>{t('docs')}</a>
        <a href={`${docs}/docs/deployment`}>{t('deployDocs')}</a>
        <span>© {new Date().getFullYear()} AIM Studio</span>
      </footer>
    </div>
  )
}
