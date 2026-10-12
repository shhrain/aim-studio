import { PARAM_NAME_REG, PARAM_TOKEN_REG, REJECT_TEXT } from './constants'

export function replaceAll(str: string, search: string, replacement: string): string
export function replaceAll<T>(str: T, search: string, replacement: string): T
export function replaceAll(str: unknown, search: string, replacement: string) {
  if (str == null) return str
  return String(str).split(search).join(replacement)
}

export function replaceSymbol<T extends string | undefined | null>(str: T): T {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br>/g, '') as T
}

export function stripReject<T extends string | undefined | null>(str: T): T {
  if (!str) return str
  return replaceAll(replaceAll(String(str), ' ' + REJECT_TEXT, ''), REJECT_TEXT, '') as T
}

const stripInner = (html: string) => html.replace(/<[^>]+>/g, '')

/**
 * 动态参数（<span>参数</span>）→ ${参数}，移除 <i> 标记。
 * 旧实现依赖 DOM；此处用正则等价实现，可在 SSR / Node 运行。
 */
export function getTextParam(html: string | undefined | null): string {
  if (!html) return ''
  return html
    .replace(/<i\b[^>]*>[\s\S]*?<\/i>/g, '')
    .replace(
      /<span\b[^>]*>([\s\S]*?)<\/span> ?/g,
      (_, inner: string) => '${' + stripInner(inner) + '}',
    )
}

export function stripDynamicParams(html: string | undefined | null): string {
  return getTextParam(html || '').replace(/(\${.*?}+)/g, '')
}

/** 任意层级转义的参数节点（如 actionDetail 内二次 JSON 序列化的 <input>） */
const ESCAPED_PARAM_INPUT_REG =
  /<input[^>]*?\bvalue=(?:\\+)?["'](?:\$)?\{#([^#{}]+?)#\}(?:\\+)?["'][^>]*>/g

/**
 * 参数节点 → 协议变量 ${x}
 * - legacy：与旧实现一致，仅替换一层转义的 <input>
 * - fixed：额外处理多层转义节点与 {#x#} 占位（新文档默认）
 */
export function htmlParamsToTpl<T>(payload: T, mode: 'legacy' | 'fixed' = 'legacy'): T {
  if (payload == null) return payload
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  let replaced = raw.replace(
    PARAM_NAME_REG,
    (_: string, __: string, param: string) => '${' + param + '}',
  )
  if (mode === 'fixed') {
    replaced = replaced
      .replace(ESCAPED_PARAM_INPUT_REG, (_: string, param: string) => '${' + param + '}')
      .replace(PARAM_TOKEN_REG, (_: string, param: string) => '${' + param + '}')
  }
  return (typeof payload === 'string' ? replaced : JSON.parse(replaced)) as T
}

export function isValidHttpsUrl(string: string | undefined | null): boolean {
  return /^(https:\/\/)/.test(string || '')
}
