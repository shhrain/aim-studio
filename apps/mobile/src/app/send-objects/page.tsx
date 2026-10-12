import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContactsView } from './contacts-view'

export const metadata: Metadata = { title: '通讯录' }

export default function Page() {
  return (
    <Suspense>
      <ContactsView />
    </Suspense>
  )
}
