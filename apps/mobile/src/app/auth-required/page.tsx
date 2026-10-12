import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthView } from './auth-view'

export const metadata: Metadata = { title: '请登录' }

export default function Page() {
  return (
    <Suspense>
      <AuthView />
    </Suspense>
  )
}
