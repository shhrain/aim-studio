import { PARAM_TOKEN_REG } from '@aim/template-schema'
import { escapeHtml } from '@aim/utils'
import type { ParamDisplay } from './context'

/** 旧编辑器参数节点 <input value="{#x#}"> → {#x#} */
const LEGACY_INPUT = /<input[^>]*?\bvalue=\\?["'](?:\$)?\{#([^#{}]+?)#\}\\?["'][^>]*>/g
/** 协议变量 ${x} */
const TPL_VAR = /\$\{([^}]{1,30})\}/g
const ALLOWED = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'br',
  'p',
  'div',
  'span',
  'sup',
  'sub',
])
const SAFE_STYLE =
  /^(color|font-weight|font-style|text-decoration|background-color)\s*:\s*[#\w\s(),.%-]+$/i

export interface ParamResolver {
  display: ParamDisplay
  values: Record<string, string>
  examples: Record<string, string>
}

function resolveValue(name: string, r: ParamResolver): string | null {
  if (r.display === 'token') return null
  if (r.display === 'value' && r.values[name] != null && r.values[name] !== '')
    return r.values[name]!
  return r.examples[name] ?? r.values[name] ?? null
}

function cleanStyle(attrs: string): string {
  const m = /style\s*=\s*"([^"]*)"|style\s*=\s*'([^']*)'/i.exec(attrs)
  if (!m) return ''
  const safe = (m[1] ?? m[2] ?? '')
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && SAFE_STYLE.test(d) && !/url\s*\(|expression/i.test(d))
  return safe.length ? ` style="${escapeHtml(safe.join(';'))}"` : ''
}

/**
 * 确定性白名单净化：服务端与浏览器输出一致（避免 SSR 水合不一致）。
 * 仅保留少量格式标签与安全的 style 声明，其余标签全部移除。
 */
export function sanitizeRich(html: string): string {
  let prev = ''
  let out = html
  // 先移除危险容器及其内容
  while (prev !== out) {
    prev = out
    out = out.replace(
      /<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi,
      '',
    )
  }
  prev = ''
  while (prev !== out) {
    prev = out
    out = out.replace(
      /<\s*(\/?)\s*([a-zA-Z][\w-]*)([^<>]*)>/g,
      (_, close: string, tag: string, attrs: string) => {
        const name = tag.toLowerCase()
        if (!ALLOWED.has(name)) return ''
        if (close) return `</${name}>`
        return name === 'br' ? '<br>' : `<${name}${cleanStyle(attrs)}>`
      },
    )
  }
  // 残留的未闭合尖括号转义
  return out.replace(/<(?!\/?(?:b|strong|i|em|u|s|br|p|div|span|sup|sub)\b)/gi, '&lt;')
}

/** 文本 → 安全 HTML：参数替换 / 高亮 + 白名单净化（token 模式输出 .aim-param 高亮） */
export function renderTextHtml(text: string | undefined, r: ParamResolver): string {
  if (!text) return ''
  const slots: string[] = []
  const normalized = text
    .replace(LEGACY_INPUT, (_, n: string) => `{#${n}#}`)
    .replace(TPL_VAR, (_, n: string) => `{#${n}#}`)
    .replace(PARAM_TOKEN_REG, (_, name: string) => {
      const v = resolveValue(name, r)
      slots.push(
        v == null
          ? `<span class="aim-param" data-param="${escapeHtml(name)}">${escapeHtml(name)}</span>`
          : escapeHtml(v),
      )
      return `\u0000${slots.length - 1}\u0000`
    })
  const safe = sanitizeRich(normalized.replace(/\r?\n/g, '<br>'))
  // eslint-disable-next-line no-control-regex -- \u0000 为内部占位分隔符，用户输入中不会出现
  return safe.replace(/\u0000(\d+)\u0000/g, (_, i: string) => slots[Number(i)] ?? '')
}

/** 纯文本参数替换（按钮文案、链接等不渲染 HTML 的位置） */
export function renderTextPlain(text: string | undefined, r: ParamResolver): string {
  if (!text) return ''
  return text
    .replace(LEGACY_INPUT, (_, n: string) => `{#${n}#}`)
    .replace(TPL_VAR, (_, n: string) => `{#${n}#}`)
    .replace(PARAM_TOKEN_REG, (_, name: string) => resolveValue(name, r) ?? `{${name}}`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
