import { NextResponse } from 'next/server'
export function GET() {
  return NextResponse.json({ message: '分享已迁移至 /api/v1/public/shares' }, { status: 410 })
}
export const POST = GET
