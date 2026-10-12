import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TemplateList } from './template-list'

export const metadata: Metadata = { title: '模板体验' }

export default function Page() {
  return (
    <Suspense>
      <TemplateList />
    </Suspense>
  )
}
