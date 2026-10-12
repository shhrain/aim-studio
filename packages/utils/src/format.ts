const pad = (n: number, len = 2) => String(n).padStart(len, '0')

/**
 * 日期格式化，支持 YYYY MM DD HH mm ss 占位。
 * @example formatDate(Date.now(), 'YYYY-MM-DD HH:mm')
 */
export function formatDate(value: Date | number | string, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return pattern
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

/** 毫秒时长 → mm:ss（超过 1 小时为 hh:mm:ss） */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 字节数 → 人类可读 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

/** 金额：保留两位小数 */
export function formatMoney(value: number | string): string {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : String(value)
}

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / 日期 */
export function formatRelative(value: Date | number | string, now = Date.now()): string {
  const t = new Date(value).getTime()
  const diff = Math.floor((now - t) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(t, 'YYYY-MM-DD')
}

/** 中文按 1 个字符计数（按 Unicode 码点） */
export function charLength(input: string | null | undefined): number {
  return input ? [...input].length : 0
}

/** 按字符数截断 */
export function truncate(input: string, max: number, ellipsis = '…'): string {
  const chars = [...input]
  return chars.length > max ? chars.slice(0, max).join('') + ellipsis : input
}
