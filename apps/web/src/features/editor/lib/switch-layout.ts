import { createDocument, findBySlot, updateElement } from '@aim/template-core'
import { requireLayout, type TemplateDocument } from '@aim/template-schema'

/**
 * 切换版式：生成新版式蓝图，并把同名槽位、同类型元素的内容迁移过去（标题、描述、主图、按钮等）。
 * 模板 ID、名称、参数、用途保持不变；厂商取新旧版式支持的交集。
 */
export function switchLayout(doc: TemplateDocument, layoutId: string): TemplateDocument {
  const layout = requireLayout(layoutId)
  let next = createDocument({ layoutId, id: doc.id, name: doc.name, usage: doc.usage })
  for (const el of next.pages[0]!.elements) {
    if (!el.slot) continue
    const prev = findBySlot(doc, el.slot)
    if (!prev || prev.type !== el.type) continue
    const keep: Record<string, unknown> = { ...prev.props }
    if (el.type === 'image' || el.type === 'video') delete keep.ratio
    next = updateElement(next, el.id, { props: keep, event: prev.event ?? el.event })
  }
  const vendors = doc.vendors.filter((v) => layout.vendors.includes(v))
  return {
    ...next,
    params: doc.params,
    vendors: vendors.length ? vendors : [...layout.vendors],
    recognition: doc.recognition,
    meta: { ...doc.meta, updatedAt: Date.now() },
  }
}
