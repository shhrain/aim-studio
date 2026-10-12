import {
  LAYOUTS,
  expandSlots,
  parseTemplateDocument,
  paramToken,
  requireLayout,
  type TemplateDocument,
} from '@aim/template-schema'
import { describe, expect, it } from 'vitest'
import {
  addElement,
  applySettings,
  cloneDocument,
  convertDocument,
  createDocument,
  createShareUrl,
  findBySlot,
  fromLegacyPages,
  parseShareHash,
  precheck,
  registry,
  renameParam,
  supportsIntegrated,
  syncParams,
  toLegacyPages,
  updateElement,
} from '../src'

const fill = (doc: TemplateDocument, slot: string, props: Record<string, unknown>) => {
  const el = findBySlot(doc, slot)
  if (!el) throw new Error(`slot ${slot} not found`)
  return updateElement(doc, el.id, { props })
}

describe('版式蓝图', () => {
  it.each(LAYOUTS.map((l) => [l.name, l.id]))('%s（%s）可创建并通过结构校验', (_name, id) => {
    const doc = createDocument({ layoutId: id, name: '测试模板' })
    const parsed = parseTemplateDocument(doc)
    if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues.slice(0, 3)))
    const layout = requireLayout(id)
    if (!layout.free) {
      const slotKeys = new Set(doc.pages[0]!.elements.map((e) => e.slot))
      for (const slot of expandSlots(layout, doc.settings).filter((s) => s.required)) {
        expect(slotKeys.has(slot.key), `${layout.name} 缺少槽位 ${slot.key}`).toBe(true)
      }
    }
  })

  it('所有元素类型均已注册', () => {
    expect(registry.elements()).toHaveLength(32)
    expect(registry.rules().length).toBeGreaterThanOrEqual(6)
  })
})

describe('文档操作', () => {
  it('修改设置时保留已填写内容', () => {
    let doc = createDocument({ layoutId: 'com.hbm.notification', name: '物流通知' })
    doc = fill(doc, 'title', { text: '您的包裹已发出' })
    doc = applySettings(doc, { pairCount: 4, buttonCount: 1 })
    expect(
      findBySlot(doc, 'title')?.type === 'text' && findBySlot(doc, 'title')?.props,
    ).toMatchObject({ text: '您的包裹已发出' })
    expect(doc.pages[0]!.elements.filter((e) => e.slot?.startsWith('kv.'))).toHaveLength(8)
    expect(doc.pages[0]!.elements.filter((e) => e.type === 'button')).toHaveLength(1)
  })

  it('轮播比例切换 cardId 变体', () => {
    const doc = applySettings(createDocument({ layoutId: 'com.hbm.carouselImageSixteenToNine' }), {
      ratio: '1:1',
    })
    expect(doc.cardId).toBe('com.hbm.carouselQuareImage')
  })

  it('参数自动同步与重命名', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    doc = syncParams(fill(doc, 'title', { text: `你好${paramToken('姓名')}` }))
    expect(doc.params.map((p) => p.name)).toContain('姓名')
    doc = renameParam(doc, '姓名', 'name')
    expect(JSON.stringify(doc.pages)).toContain('{#name#}')
    expect(doc.params.find((p) => p.name === 'name')).toBeTruthy()
  })

  it('自由版式新增元素会撑高画布', () => {
    const base = createDocument({ layoutId: 'com.hbm.custom' })
    const { doc } = addElement(base, 'map', { y: 400 })
    expect(doc.pages[0]!.style.height).toBeGreaterThan(400)
  })

  it('复制模板生成新 ID 与草稿状态', () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '原模板' })
    const copy = cloneDocument(doc)
    expect(copy.id).not.toBe(doc.id)
    expect(copy.name).toBe('原模板-副本')
  })
})

describe('预检', () => {
  it('默认文案与占位图被拦截', () => {
    const report = precheck(createDocument({ layoutId: 'com.hbm.imageandtext' }))
    expect(report.passed).toBe(false)
    const codes = report.issues.map((i) => i.code)
    expect(codes).toContain('basic.name')
    expect(codes).toContain('slot.image')
    expect(codes).toContain('event.required')
  })

  it('填写完整后通过', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '国庆活动' })
    doc = fill(doc, 'media', { src: 'https://cdn.example.com/a.png' })
    doc = fill(doc, 'title', { text: '国庆出游季' })
    doc = fill(doc, 'description', { text: '精选线路限时特惠，名额有限。' })
    const btn = findBySlot(doc, 'button.0')!
    doc = updateElement(doc, btn.id, {
      props: { text: '立即抢购' },
      event: { action: 'OPEN_URL', target: 'https://a.example.com' },
    })
    const media = findBySlot(doc, 'media')!
    doc = updateElement(doc, media.id, { event: undefined })
    const report = precheck(doc)
    expect(report.errors).toEqual([])
    expect(report.passed).toBe(true)
  })

  it('字数超限、非 https、厂商不支持', () => {
    let doc = createDocument({
      layoutId: 'com.hbm.shortVideoImage.v2',
      name: '短剧',
      vendors: ['huawei', 'vivo'],
    })
    doc = fill(doc, 'title', { text: '这是一个非常非常非常非常非常长的短剧标题' })
    const btn = findBySlot(doc, 'button.0')!
    doc = updateElement(doc, btn.id, {
      event: { action: 'OPEN_URL', target: 'http://insecure.example.com' },
    })
    const codes = precheck(doc).errors.map((i) => i.code)
    expect(codes).toContain('slot.maxLength')
    expect(codes).toContain('event.https')
    expect(codes).toContain('vendor.unsupported')
  })
})

describe('转换与适配', () => {
  it('支持三信融合的版式可从新文档转换', () => {
    for (const layout of LAYOUTS.filter((l) => l.protocols.includes('rcs'))) {
      const doc = createDocument({ layoutId: layout.id })
      expect(supportsIntegrated(doc.cardId)).toBe(true)
      const result = convertDocument(doc)
      expect(result, layout.name).not.toBeNull()
      expect(result!.rcsTplContent.content.length).toBeGreaterThan(0)
    }
    expect(convertDocument(createDocument({ layoutId: 'com.hbm.sideslip' }))).toBeNull()
  })

  it('新文档参数导出为 ${x}', () => {
    let doc = createDocument({ layoutId: 'com.hbm.imageandtext' })
    doc = syncParams(fill(doc, 'title', { text: `${paramToken('姓名')}您好` }))
    const result = convertDocument(doc)!
    expect(result.rcsTplContent.content[0]!.title).toBe('${姓名}您好')
    expect(result.rcsTplContent.params?.[0]?.pName).toBe('${姓名}')
  })

  it('旧 pages 往返', () => {
    const doc = createDocument({ layoutId: 'com.hbm.notification', name: '通知' })
    const legacy = toLegacyPages(doc)
    const back = fromLegacyPages(JSON.stringify(legacy), { name: '通知' })
    expect(back.layoutId).toBe('com.hbm.notification')
    expect(back.pages[0]!.elements.length).toBe(doc.pages[0]!.elements.length)
    expect(back.pages[0]!.elements.some((e) => e.slot === 'kv.1.value')).toBe(true)
    expect(parseTemplateDocument(back).success).toBe(true)
  })

  it('分享链接编码 / 过期', async () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '分享' })
    const url = await createShareUrl(doc, 'https://m.example.com/preview/share', {
      vendor: 'vivo',
      now: 1000,
    })
    const hash = url.slice(url.indexOf('#'))
    const ok = await parseShareHash(hash, 2000)
    expect(ok.ok && ok.payload.doc.name).toBe('分享')
    const expired = await parseShareHash(hash, 1000 + 31 * 60 * 1000)
    expect(expired.ok).toBe(false)
  })
})
