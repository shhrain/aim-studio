import { createShareUrl } from '@aim/template-core'
import { SHARE_TTL_MS, type TemplateDocument, type VendorId } from '@aim/template-schema'
import { env } from '@/lib/api'

const cache = new Map<string, Promise<string>>()

/**
 * 生成扫码预览链接（30 分钟有效）：
 * 1. 优先调用移动端应用的分享接口（/api/share），二维码只包含短链接，可跨设备扫码；
 * 2. 移动端未启动时，退化为把模板压缩编码进 URL hash。
 */
export function createShareLink(doc: TemplateDocument, vendor: VendorId | string): Promise<string> {
  const key = `${doc.id}:${doc.meta.updatedAt}:${vendor}`
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        try {
          const res = await fetch(`${env.mobileUrl}/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: doc, vendor, ttl: SHARE_TTL_MS }),
          })
          if (!res.ok) throw new Error(String(res.status))
          const { id } = (await res.json()) as { id: string }
          return `${env.mobileUrl}/preview/${id}`
        } catch {
          return createShareUrl(doc, `${env.mobileUrl}/preview/share`, {
            vendor: vendor as VendorId,
          })
        }
      })(),
    )
  }
  return cache.get(key)!
}
