import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GuideView } from './guide-view'

export const metadata: Metadata = { title: '阅信开启指引' }

export default function Page() {
  return (
    <Suspense>
      <GuideView />
    </Suspense>
  )
}
