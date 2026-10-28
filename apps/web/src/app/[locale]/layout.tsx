import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { messages, type Locale } from '@aim/i18n'
import type { ReactNode } from 'react'
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (locale !== 'zh-CN' && locale !== 'en') notFound()
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale as Locale]}
      timeZone="Asia/Shanghai"
    >
      {children}
    </NextIntlClientProvider>
  )
}
