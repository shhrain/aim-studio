import type { Metadata } from 'next'
import { GalleryView } from './gallery-view'

export const metadata: Metadata = { title: '版式画廊' }

export default function Page() {
  return <GalleryView />
}
