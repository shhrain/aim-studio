import type { Metadata } from 'next'
import { SharePreview } from './share-preview'

export const metadata: Metadata = { title: '模板预览' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SharePreview id={id} />
}
