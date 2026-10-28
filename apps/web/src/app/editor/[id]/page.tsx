import type { Metadata } from 'next'
import { EditorPage } from '@/features/editor/editor-page'
import { LegacyEntry } from '@/features/platform/legacy-entry'

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
  return process.env.NEXT_PUBLIC_API_MOCK === 'true' ? (
    <EditorPage id={id} initialLayout={layout} />
  ) : (
    <LegacyEntry id={id} />
  )
}
