import { SHARE_TTL_MS, type TemplateDocument, type VendorId } from '@aim/template-schema'
import { decodeJson, encodeJson } from '@aim/utils'

export interface SharePayload {
  doc: TemplateDocument
  vendor?: VendorId
  expiresAt: number
}

/**
 * 生成扫码预览链接：模板压缩编码进 URL hash，免后端即可跨设备预览；默认 30 分钟有效。
 * @example await createShareUrl(doc, 'https://m.example.com/preview/share', { vendor: 'huawei' })
 */
export async function createShareUrl(
  doc: TemplateDocument,
  baseUrl: string,
  options: { vendor?: VendorId; ttl?: number; now?: number } = {},
): Promise<string> {
  const payload: SharePayload = { doc, vendor: options.vendor, expiresAt: (options.now ?? Date.now()) + (options.ttl ?? SHARE_TTL_MS) }
  return `${baseUrl}#d=${await encodeJson(payload)}`
}

export type ShareParseResult =
  | { ok: true; payload: SharePayload }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired'; message: string }

/** 解析扫码预览链接的 hash（`#d=...`） */
export async function parseShareHash(hash: string, now = Date.now()): Promise<ShareParseResult> {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('d')
  if (!value) return { ok: false, reason: 'missing', message: '链接缺少预览数据' }
  try {
    const payload = await decodeJson<SharePayload>(value)
    if (payload.expiresAt < now) return { ok: false, reason: 'expired', message: '二维码已过期（30 分钟内有效），请在编辑器重新生成' }
    return { ok: true, payload }
  } catch {
    return { ok: false, reason: 'invalid', message: '预览数据已损坏，请重新扫码' }
  }
}
