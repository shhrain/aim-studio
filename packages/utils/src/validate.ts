/** 中国大陆手机号 */
export const MOBILE_REG = /^1[3-9]\d{9}$/

export function isMobile(value: string | null | undefined): boolean {
  return MOBILE_REG.test((value ?? '').trim())
}

/** 手机号脱敏：138****1234 */
export function maskMobile(value: string): string {
  return isMobile(value) ? `${value.slice(0, 3)}****${value.slice(7)}` : value
}

export function isHttpsUrl(value: string | null | undefined): boolean {
  return /^https:\/\//i.test(value ?? '')
}

export function isUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isEmail(value: string | null | undefined): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '')
}

/** 从任意文本中解析手机号列表（逗号 / 空格 / 换行分隔），去重并保持顺序 */
export function parseMobiles(input: string): { valid: string[]; invalid: string[] } {
  const parts = input
    .split(/[\s,，;；、]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const valid: string[] = []
  const invalid: string[] = []
  for (const p of parts) {
    if (isMobile(p)) {
      if (!valid.includes(p)) valid.push(p)
    } else if (!invalid.includes(p)) invalid.push(p)
  }
  return { valid, invalid }
}
