import { parseTemplateDocument, SHARE_TTL_MS } from '@aim/template-schema'
import { NextResponse } from 'next/server'
import { putShare } from '@/lib/share-store'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** 创建扫码预览分享：POST { document, vendor, ttl } → { id, expiresAt } */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { document: unknown; vendor?: string; ttl?: number }
    const parsed = parseTemplateDocument(body.document)
    if (!parsed.success)
      return NextResponse.json({ message: '模板数据不合法' }, { status: 400, headers: CORS })
    const expiresAt = Date.now() + Math.min(body.ttl ?? SHARE_TTL_MS, SHARE_TTL_MS)
    const id = putShare({ document: body.document as never, vendor: body.vendor, expiresAt })
    return NextResponse.json({ id, expiresAt }, { headers: CORS })
  } catch {
    return NextResponse.json({ message: '请求格式错误' }, { status: 400, headers: CORS })
  }
}
