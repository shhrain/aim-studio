import type { TemplateDocument } from '@aim/template-schema'

export interface ShareEntry {
  document: TemplateDocument
  vendor?: string
  expiresAt: number
}

const MAX_ENTRIES = 500
const g = globalThis as unknown as { __aimShareStore?: Map<string, ShareEntry> }

/** 扫码预览分享存储（进程内存，开发 / 演示用；生产替换为 Redis 等） */
export const shareStore = (g.__aimShareStore ??= new Map<string, ShareEntry>())

export function putShare(entry: ShareEntry): string {
  const now = Date.now()
  for (const [k, v] of shareStore) if (v.expiresAt < now) shareStore.delete(k)
  while (shareStore.size >= MAX_ENTRIES) shareStore.delete(shareStore.keys().next().value!)
  const id = Math.random().toString(36).slice(2, 10)
  shareStore.set(id, entry)
  return id
}

export function getShare(id: string): ShareEntry | null {
  const e = shareStore.get(id)
  if (!e) return null
  if (e.expiresAt < Date.now()) {
    shareStore.delete(id)
    return null
  }
  return e
}
