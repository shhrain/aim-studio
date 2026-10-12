import { NextResponse } from 'next/server'
import { getShare } from '@/lib/share-store'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = getShare(id)
  if (!entry) return NextResponse.json({ message: '二维码已过期（30 分钟内有效），请在编辑器重新生成' }, { status: 404 })
  return NextResponse.json(entry, { headers: { 'Cache-Control': 'no-store' } })
}
