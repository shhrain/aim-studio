/**
 * 内置示例素材：纯 SVG data URI，离线可用、无版权风险。
 * 用于新建模板的占位图、Mock 素材库与文档示例。
 */

const PALETTES = [
  ['#5B8CFF', '#A8C3FF'],
  ['#FF8A5B', '#FFC9A8'],
  ['#2EC4A6', '#A6F0DF'],
  ['#9B6BFF', '#D6C2FF'],
  ['#FF5B8C', '#FFB3CB'],
  ['#3BA3FF', '#B5E0FF'],
  ['#F5B700', '#FFE7A3'],
  ['#4A5568', '#A0AEC0'],
] as const

function encode(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' '))}`
}

/** 默认占位图标记：预检据此提示“请替换默认图片” */
export const PLACEHOLDER_MARK = 'aim-placeholder'

/** 编辑器默认占位图（浅蓝插画） */
export function placeholderImage(width = 342, height = 192, label = '点击替换图片'): string {
  const cx = width / 2
  const cy = height / 2
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-mark="${PLACEHOLDER_MARK}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF3FF"/><stop offset="1" stop-color="#DCE6FF"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g transform="translate(${cx - 34} ${cy - 30})" fill="none" stroke="#8FA8F5" stroke-width="3" stroke-linejoin="round">
      <rect x="0" y="0" width="68" height="50" rx="8" fill="#F7F9FF"/>
      <circle cx="20" cy="17" r="6" fill="#B9C9FA" stroke="none"/>
      <path d="M6 44 L26 26 L38 36 L48 28 L62 44" />
    </g>
    <text x="${cx}" y="${cy + 42}" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="13" fill="#7A8FCC">${label}</text>
  </svg>`)
}

/** 示例图片（渐变 + 几何装饰 + 标题），seed 决定配色 */
export function sampleImage(seed: number, width = 342, height = 192, title = '', subtitle = ''): string {
  const [a, b] = PALETTES[Math.abs(seed) % PALETTES.length]!
  const r = Math.min(width, height)
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="s${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#s${seed})"/>
    <circle cx="${width * 0.85}" cy="${height * 0.2}" r="${r * 0.35}" fill="#fff" opacity=".18"/>
    <circle cx="${width * 0.1}" cy="${height * 0.95}" r="${r * 0.45}" fill="#fff" opacity=".12"/>
    <rect x="${width * 0.62}" y="${height * 0.5}" width="${r * 0.32}" height="${r * 0.32}" rx="${r * 0.06}" fill="#fff" opacity=".22" transform="rotate(18 ${width * 0.7} ${height * 0.6})"/>
    ${title ? `<text x="${width * 0.07}" y="${height * 0.5}" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${Math.round(r * 0.13)}" font-weight="700" fill="#fff">${escapeXml(title)}</text>` : ''}
    ${subtitle ? `<text x="${width * 0.07}" y="${height * 0.5 + r * 0.16}" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="${Math.round(r * 0.075)}" fill="#fff" opacity=".9">${escapeXml(subtitle)}</text>` : ''}
  </svg>`)
}

/** 示例头像 / Logo */
export function sampleAvatar(seed: number, text = '阅'): string {
  const [a, b] = PALETTES[Math.abs(seed) % PALETTES.length]!
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs><linearGradient id="a${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="96" height="96" rx="48" fill="url(#a${seed})"/>
    <text x="48" y="60" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="38" font-weight="700" fill="#fff">${escapeXml(text.slice(0, 1))}</text>
  </svg>`)
}

/** 红包底图 */
export function redpacketBackground(width = 342, height = 452): string {
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="rp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2483A"/><stop offset="1" stop-color="#D8261C"/></linearGradient>
      <linearGradient id="rpTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A55"/><stop offset="1" stop-color="#EB3B2C"/></linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="16" fill="url(#rp)"/>
    <path d="M0 16 Q0 0 16 0 H${width - 16} Q${width} 0 ${width} 16 V${height * 0.42} Q${width / 2} ${height * 0.56} 0 ${height * 0.42} Z" fill="url(#rpTop)"/>
    <circle cx="${width / 2}" cy="${height * 0.49}" r="34" fill="#FFD27A"/>
    <text x="${width / 2}" y="${height * 0.49 + 12}" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="32" font-weight="700" fill="#D8261C">開</text>
  </svg>`)
}

export function isPlaceholderSrc(src: string | undefined): boolean {
  return !src || src.includes(PLACEHOLDER_MARK) || src.includes(encodeURIComponent(PLACEHOLDER_MARK))
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!)
}
