import type { Metadata } from 'next'
import { RecordsView } from './records-view'

export const metadata: Metadata = { title: '发送记录' }

export default function Page() {
  return <RecordsView />
}
