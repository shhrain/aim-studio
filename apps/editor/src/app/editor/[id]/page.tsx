import type { Metadata } from 'next'
import { EditorPage } from '@/features/editor/editor-page'

export const metadata: Metadata = { title: '模板编辑' }

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ layout?: string }>
}) {
  const { id } = await params
  const { layout } = await searchParams
  return <EditorPage id={id} initialLayout={layout} />
}
