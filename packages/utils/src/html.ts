import DOMPurify from 'dompurify'

/** 模板富文本允许的标签（与编辑器工具栏能力一致） */
export const ALLOWED_TAGS = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'br',
  'span',
  'p',
  'div',
  'font',
  'sup',
  'sub',
]
export const ALLOWED_ATTR = ['style', 'color', 'class', 'data-param']

const ENTITY: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** 转义为纯文本 HTML */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ENTITY[c] ?? c)
}

/** 反转义常见 HTML 实体 */
export function unescapeHtml(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/** 去除所有标签，保留换行 */
export function stripTags(input: string): string {
  return unescapeHtml(
    input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\n{3,}/g, '\n\n')
}

/**
 * 净化用户富文本：浏览器端使用 DOMPurify 白名单；
 * 服务端（无 DOM）退化为转义，保证 SSR 不输出可执行内容。
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''
  if (typeof window === 'undefined' || !DOMPurify.isSupported) {
    return escapeHtml(stripTags(input)).replace(/\n/g, '<br>')
  }
  return DOMPurify.sanitize(input, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false })
}
