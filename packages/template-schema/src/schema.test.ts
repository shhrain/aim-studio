import { describe, expect, it } from 'vitest'
import {
  ACTION_TYPES,
  ELEMENT_TYPES,
  LAYOUTS,
  VENDOR_IDS,
  createActionEvent,
  expandSlots,
  extractParams,
  getLayout,
  groupLayouts,
  paramsToTplVariables,
  requireLayout,
  resolveCardId,
  templateElementSchema,
} from './index'

describe('template-schema 目录', () => {
  it('33 种标准版式 + 1 种自由版式，ID 唯一', () => {
    expect(LAYOUTS.filter((l) => !l.free)).toHaveLength(33)
    expect(LAYOUTS.filter((l) => l.free)).toHaveLength(1)
    const ids = LAYOUTS.flatMap((l) => [l.id, ...(l.aliases ?? [])])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('32 种元素、15 种事件、8 个厂商', () => {
    expect(ELEMENT_TYPES).toHaveLength(32)
    expect(ACTION_TYPES).toHaveLength(15)
    expect(VENDOR_IDS).toHaveLength(8)
  })

  it('每个版式至少支持一个厂商，且只支持已知厂商', () => {
    for (const l of LAYOUTS) {
      expect(l.vendors.length).toBeGreaterThan(0)
      for (const v of l.vendors) expect(VENDOR_IDS).toContain(v)
    }
  })

  it('别名与变体可查到版式', () => {
    expect(getLayout('com.hbm.carouselQuareImage')?.id).toBe('com.hbm.carouselImageSixteenToNine')
    expect(getLayout('com.hbm.redpacketPersonal')?.name).toBe('个性化红包')
    const carousel = requireLayout('com.hbm.carouselImageSixteenToNine')
    expect(resolveCardId(carousel, { ratio: '3:4' })).toBe('com.hbm.carouselVerticalImage')
  })

  it('按分类分组', () => {
    expect(groupLayouts('notify').map((g) => g.label)).toEqual(['通知', '行程通知'])
    expect(groupLayouts('service').map((g) => g.label)).toContain('电商')
  })

  it('展开重复槽位', () => {
    const slots = expandSlots(requireLayout('com.hbm.notification'), { pairCount: 3, buttonCount: 1 })
    expect(slots.filter((s) => s.key.startsWith('kv.')).map((s) => s.key)).toEqual([
      'kv.0.label',
      'kv.0.value',
      'kv.1.label',
      'kv.1.value',
      'kv.2.label',
      'kv.2.value',
    ])
    expect(slots.filter((s) => s.key.startsWith('button.'))).toHaveLength(1)
  })
})

describe('参数语法', () => {
  it('提取与转换', () => {
    const text = '尊敬的{#姓名#}，您的验证码{#code#}，{#姓名#}'
    expect(extractParams(text)).toEqual(['姓名', 'code'])
    expect(paramsToTplVariables(text)).toBe('尊敬的${姓名}，您的验证码${code}，${姓名}')
  })
})

describe('元素校验', () => {
  it('props 按类型校验', () => {
    const ok = templateElementSchema.safeParse({
      id: 'e1',
      type: 'button',
      x: 0,
      y: 0,
      w: 100,
      h: 36,
      props: { text: '立即查看' },
      event: createActionEvent('OPEN_URL'),
    })
    expect(ok.success).toBe(true)
    const bad = templateElementSchema.safeParse({ id: 'e2', type: 'button', x: 0, y: 0, w: 1, h: 1, props: {} })
    expect(bad.success).toBe(false)
  })
})
