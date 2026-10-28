import type { Metadata } from 'next'
import { TemplatesPage } from '@/features/templates/templates-page'
import { LegacyEntry } from '@/features/platform/legacy-entry'

export const metadata: Metadata = { title: '我的模板' }

export default function Page() {
  return process.env.NEXT_PUBLIC_API_MOCK === 'true' ? <TemplatesPage /> : <LegacyEntry />
}
