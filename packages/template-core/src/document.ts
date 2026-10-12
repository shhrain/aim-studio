import {
  SCHEMA_VERSION,
  createParam,
  defaultLayoutSettings,
  extractParams,
  requireLayout,
  resolveCardId,
  type AnyElement,
  type ElementType,
  type TemplateDocument,
  type TemplatePage,
  type TemplateParam,
  type TemplateUsage,
  type VendorId,
} from '@aim/template-schema'
import { deepClone, uid } from '@aim/utils'
import { createElement, type CreateElementOptions } from './elements/factory'
import { elementTexts, registry } from './registry'

export interface CreateDocumentOptions {
  layoutId: string
  name?: string
  usage?: TemplateUsage
  settings?: Record<string, unknown>
  vendors?: VendorId[]
  id?: string
  now?: number
}

/** 根据版式蓝图生成页面 */
export function buildPage(layoutId: string, settings: Record<string, unknown>): TemplatePage {
  const layout = requireLayout(layoutId)
  const blueprint = registry.blueprint(layout.id)
  if (!blueprint) throw new Error(`版式 ${layout.name}（${layout.id}）缺少蓝图，请通过 registerPlugin 注册`)
  return { id: uid('page'), ...blueprint({ layout, settings }) }
}

/** 新建模板文档 */
export function createDocument(options: CreateDocumentOptions): TemplateDocument {
  const layout = requireLayout(options.layoutId)
  const settings = { ...defaultLayoutSettings(layout), ...(options.settings ?? {}) }
  const now = options.now ?? Date.now()
  const doc: TemplateDocument = {
    schemaVersion: SCHEMA_VERSION,
    id: options.id ?? uid('tpl'),
    name: options.name ?? '',
    usage: options.usage ?? 'commercial',
    category: layout.category,
    layoutId: layout.id,
    cardId: resolveCardId(layout, settings),
    vendors: options.vendors ?? [...layout.vendors],
    recognition: 'shortLink',
    params: [],
    settings,
    pages: [buildPage(layout.id, settings)],
    meta: { status: 'draft', createdAt: now, updatedAt: now },
  }
  return syncParams(doc)
}

/**
 * 修改版式设置：按新设置重建蓝图，并把旧页面中同槽位的内容迁移过去，
 * 用户已填写的标题、图片、按钮等不会因调整“按钮数量 / 参数对数量”而丢失。
 */
export function applySettings(doc: TemplateDocument, patch: Record<string, unknown>): TemplateDocument {
  const layout = requireLayout(doc.layoutId)
  const settings = { ...doc.settings, ...patch }
  const fresh = buildPage(layout.id, settings)
  const old = new Map(doc.pages[0]!.elements.filter((e) => e.slot).map((e) => [e.slot!, e]))
  fresh.elements = fresh.elements.map((el) => {
    const prev = el.slot ? old.get(el.slot) : undefined
    if (!prev || prev.type !== el.type) return el
    const merged = { ...el, props: mergeProps(el, prev), style: { ...el.style, ...prev.style }, event: prev.event ?? el.event }
    return merged as AnyElement
  })
  return touch({ ...doc, settings, cardId: resolveCardId(layout, settings), pages: [fresh, ...doc.pages.slice(1)] })
}

function mergeProps(fresh: AnyElement, prev: AnyElement): AnyElement['props'] {
  const next = { ...fresh.props, ...prev.props } as Record<string, unknown>
  // 列表类复合元素：数量以新设置为准，内容尽量保留
  for (const key of ['cards', 'items', 'options', 'fields'] as const) {
    const a = (fresh.props as Record<string, unknown>)[key]
    const b = (prev.props as Record<string, unknown>)[key]
    if (Array.isArray(a) && Array.isArray(b)) next[key] = a.map((item, i) => b[i] ?? item)
  }
  if ('ratio' in fresh.props) next.ratio = (fresh.props as { ratio?: unknown }).ratio
  return next as AnyElement['props']
}

/** 更新时间戳 */
export function touch(doc: TemplateDocument, now = Date.now()): TemplateDocument {
  return { ...doc, meta: { ...doc.meta, updatedAt: now } }
}

export function getPage(doc: TemplateDocument, pageIndex = 0): TemplatePage {
  const page = doc.pages[pageIndex]
  if (!page) throw new Error(`页面不存在：${pageIndex}`)
  return page
}

export function findElement(doc: TemplateDocument, id: string): AnyElement | undefined {
  for (const page of doc.pages) {
    const el = page.elements.find((e) => e.id === id)
    if (el) return el
  }
  return undefined
}

export function findBySlot(doc: TemplateDocument, slot: string): AnyElement | undefined {
  return doc.pages[0]?.elements.find((e) => e.slot === slot)
}

function mapElements(doc: TemplateDocument, fn: (els: AnyElement[]) => AnyElement[], pageIndex = 0): TemplateDocument {
  return touch({ ...doc, pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, elements: fn(p.elements) } : p)) })
}

/** 浅合并更新元素（props / style 深一层合并） */
export function updateElement(
  doc: TemplateDocument,
  id: string,
  patch: Partial<Omit<AnyElement, 'props' | 'style'>> & { props?: Record<string, unknown>; style?: Record<string, unknown> },
): TemplateDocument {
  return touch({
    ...doc,
    pages: doc.pages.map((p) => ({
      ...p,
      elements: p.elements.map((e) =>
        e.id === id
          ? ({
              ...e,
              ...patch,
              props: patch.props ? { ...e.props, ...patch.props } : e.props,
              style: patch.style ? { ...e.style, ...patch.style } : e.style,
            } as AnyElement)
          : e,
      ),
    })),
  })
}

export function addElement<T extends ElementType>(
  doc: TemplateDocument,
  type: T,
  options: CreateElementOptions<T> = {},
  pageIndex = 0,
): { doc: TemplateDocument; element: AnyElement } {
  const page = getPage(doc, pageIndex)
  const maxZ = page.elements.reduce((m, e) => Math.max(m, e.z ?? 0), 0)
  const bottom = page.elements.reduce((m, e) => Math.max(m, e.y + e.h), 0)
  const element = createElement(type, { y: options.y ?? (page.mode === 'flow' ? bottom + 12 : 24), x: options.x ?? 14, z: maxZ + 1, ...options }) as AnyElement
  let next = mapElements(doc, (els) => [...els, element], pageIndex)
  if (page.mode === 'absolute' && element.y + element.h > page.style.height) {
    next = updatePageStyle(next, { height: element.y + element.h + 14 }, pageIndex)
  }
  return { doc: next, element }
}

export function removeElement(doc: TemplateDocument, id: string): TemplateDocument {
  return touch({ ...doc, pages: doc.pages.map((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) })) })
}

export function duplicateElement(doc: TemplateDocument, id: string): { doc: TemplateDocument; element?: AnyElement } {
  const src = findElement(doc, id)
  if (!src) return { doc }
  const element = { ...deepClone(src), id: uid('el'), slot: undefined, x: src.x + 12, y: src.y + 12, z: (src.z ?? 0) + 1 } as AnyElement
  const pageIndex = doc.pages.findIndex((p) => p.elements.some((e) => e.id === id))
  return { doc: mapElements(doc, (els) => [...els, element], pageIndex), element }
}

/** 图层顺序调整 */
export function arrangeElement(doc: TemplateDocument, id: string, to: 'front' | 'back' | 'forward' | 'backward'): TemplateDocument {
  const pageIndex = doc.pages.findIndex((p) => p.elements.some((e) => e.id === id))
  return mapElements(
    doc,
    (els) => {
      const sorted = [...els].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
      const i = sorted.findIndex((e) => e.id === id)
      const [el] = sorted.splice(i, 1)
      const target = to === 'front' ? sorted.length : to === 'back' ? 0 : to === 'forward' ? Math.min(sorted.length, i + 1) : Math.max(0, i - 1)
      sorted.splice(target, 0, el!)
      const zOf = new Map(sorted.map((e, idx) => [e.id, idx]))
      return els.map((e) => ({ ...e, z: zOf.get(e.id) ?? 0 }) as AnyElement)
    },
    Math.max(0, pageIndex),
  )
}

export function updatePageStyle(doc: TemplateDocument, style: Partial<TemplatePage['style']>, pageIndex = 0): TemplateDocument {
  return touch({ ...doc, pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, style: { ...p.style, ...style } } : p)) })
}

/** 结构化版式转为自由版式（保留当前坐标） */
export function toFreeLayout(doc: TemplateDocument): TemplateDocument {
  return touch({
    ...doc,
    pages: doc.pages.map((p) => ({
      ...p,
      mode: 'absolute',
      style: { ...p.style, height: Math.max(p.style.height, ...p.elements.map((e) => e.y + e.h + 14)) },
    })),
  })
}

/* ------------------------------------------------------------------ */
/* 参数                                                                 */
/* ------------------------------------------------------------------ */

/** 收集文档中所有元素文本、事件字段里使用的参数名 */
export function collectUsedParams(doc: TemplateDocument): string[] {
  const names: string[] = []
  const push = (s: unknown) => {
    if (typeof s !== 'string') return
    for (const n of extractParams(s)) if (!names.includes(n)) names.push(n)
  }
  for (const page of doc.pages) {
    for (const el of page.elements) {
      elementTexts(el).forEach(push)
      Object.values(el.event ?? {}).forEach(push)
      if (el.type === 'image') push(el.props.srcParam)
      JSON.stringify(el.props).match(/\{#[^#{}\s]{1,30}#\}/g)?.forEach(push)
    }
  }
  return names
}

/** 同步参数表：补齐新使用的参数，保留已有定义；未使用的参数保留但由预检提示 */
export function syncParams(doc: TemplateDocument): TemplateDocument {
  const used = collectUsedParams(doc)
  const defined = new Map(doc.params.map((p) => [p.name, p]))
  const params: TemplateParam[] = [...doc.params]
  for (const name of used) if (!defined.has(name)) params.push(createParam(name))
  return params.length === doc.params.length ? doc : { ...doc, params }
}

/** 合并同名参数：保留首个定义（编辑器“管理参数”确定时调用） */
export function dedupeParams(params: TemplateParam[]): TemplateParam[] {
  const seen = new Set<string>()
  return params.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)))
}

/** 重命名参数：同步替换文档中所有占位 */
export function renameParam(doc: TemplateDocument, from: string, to: string): TemplateDocument {
  if (from === to) return doc
  const json = JSON.stringify(doc.pages).split(`{#${from}#}`).join(`{#${to}#}`)
  return touch({
    ...doc,
    pages: JSON.parse(json) as TemplatePage[],
    params: dedupeParams(doc.params.map((p) => (p.name === from ? { ...p, name: to } : p))),
  })
}

/** 删除未使用的参数 */
export function pruneParams(doc: TemplateDocument): TemplateDocument {
  const used = new Set(collectUsedParams(doc))
  return { ...doc, params: doc.params.filter((p) => used.has(p.name)) }
}

/** 文档深拷贝为新模板（复制模板） */
export function cloneDocument(doc: TemplateDocument, now = Date.now()): TemplateDocument {
  const copy = deepClone(doc)
  return {
    ...copy,
    id: uid('tpl'),
    name: `${doc.name || '未命名模板'}-副本`.slice(0, 20),
    meta: { status: 'draft', createdAt: now, updatedAt: now },
  }
}
