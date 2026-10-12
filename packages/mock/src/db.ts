import type { Contact, Material, SendRecord } from '@aim/api-client'
import type { TemplateDocument, TemplateStatus } from '@aim/template-schema'
import { get, set, del } from 'idb-keyval'
import { buildSampleTemplates, seedMaterials } from './fixtures'

export interface StoredTemplate {
  document: TemplateDocument
  status: TemplateStatus
  rejectReason?: string
  submittedAt?: number
}

export interface MockDb {
  version: number
  templates: Record<string, StoredTemplate>
  materials: Material[]
  contacts: Record<string, Contact[]>
  sendRecords: SendRecord[]
  feedback: { id: string; content: string; contact?: string; createdAt: number }[]
}

const KEY = 'aim-mock-db'
const VERSION = 3
const hasIdb = () => typeof indexedDB !== 'undefined'

const STATUSES: TemplateStatus[] = [
  'approved',
  'approved',
  'reviewing',
  'approved',
  'draft',
  'approved',
  'rejected',
]

export function createSeed(now = Date.now()): MockDb {
  const templates: Record<string, StoredTemplate> = {}
  buildSampleTemplates(now).forEach((s, i) => {
    const status = STATUSES[i % STATUSES.length]!
    templates[s.document.id] = {
      document: { ...s.document, meta: { ...s.document.meta, status } },
      status,
      rejectReason: status === 'rejected' ? '按钮跳转链接无法访问，请检查后重新提交' : undefined,
      submittedAt: status === 'draft' ? undefined : s.document.meta.updatedAt,
    }
  })
  return {
    version: VERSION,
    templates,
    materials: seedMaterials(now),
    contacts: {},
    sendRecords: [],
    feedback: [],
  }
}

let cache: MockDb | null = null
let loading: Promise<MockDb> | null = null
let timer: ReturnType<typeof setTimeout> | undefined

export async function getDb(): Promise<MockDb> {
  if (cache) return cache
  loading ??= (async () => {
    let stored: MockDb | undefined
    if (hasIdb()) {
      try {
        stored = await get<MockDb>(KEY)
      } catch {
        stored = undefined
      }
    }
    cache = stored && stored.version === VERSION ? stored : createSeed()
    return cache
  })()
  return loading
}

/** 提交修改（防抖写入 IndexedDB） */
export function commit() {
  if (!hasIdb() || !cache) return
  if (timer) clearTimeout(timer)
  const snapshot = cache
  timer = setTimeout(() => void set(KEY, snapshot).catch(() => undefined), 120)
}

/** 重置为种子数据 */
export async function resetDb() {
  cache = createSeed()
  loading = Promise.resolve(cache)
  if (hasIdb()) await del(KEY).catch(() => undefined)
  return cache
}
