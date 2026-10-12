import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation'
import { NextResponse, type NextRequest } from 'next/server'
import { docsContentRoute, docsRoute } from '@/lib/shared'

const { rewrite: rewriteDocs } = rewritePath(`${docsRoute}{/*path}`, `${docsContentRoute}{/*path}/content.md`)
const { rewrite: rewriteSuffix } = rewritePath(`${docsRoute}{/*path}.md`, `${docsContentRoute}{/*path}/content.md`)

/** 内容协商：AI Agent 请求 Markdown（Accept: text/markdown 或 .md 后缀）时返回原文 */
export default function proxy(request: NextRequest) {
  const suffix = rewriteSuffix(request.nextUrl.pathname)
  if (suffix) return NextResponse.rewrite(new URL(suffix, request.nextUrl))
  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname)
    if (result) return NextResponse.rewrite(new URL(result, request.nextUrl), { headers: { Vary: 'Accept' } })
  }
  return NextResponse.next()
}
