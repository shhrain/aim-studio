import type { Metadata } from 'next'
import { TemplatesPage } from '@/features/templates/templates-page'

export const metadata: Metadata = { title: '我的模板' }

export default function Page() {
  return <TemplatesPage />
}
