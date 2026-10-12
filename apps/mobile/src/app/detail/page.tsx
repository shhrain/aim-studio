import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DetailView } from './detail-view'

export const metadata: Metadata = { title: '模板详情' }

export default function Page() {
  return (
    <Suspense>
      <DetailView />
    </Suspense>
  )
}
