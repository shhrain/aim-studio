import { Landing } from '@/features/platform/landing'
import { messages, type Locale } from '@aim/i18n'
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = messages[(locale === 'en' ? 'en' : 'zh-CN') as Locale]
  return {
    title: 'AIM Studio · ' + t.tagline,
    description: t.intro,
    alternates: { languages: { 'zh-CN': '/zh-CN', en: '/en' } },
  }
}
export default function Page() {
  return <Landing />
}
