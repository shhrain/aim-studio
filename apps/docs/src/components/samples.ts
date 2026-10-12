import { createDocument, findBySlot, sampleImage, updateElement } from '@aim/template-core'
import type { TemplateDocument } from '@aim/template-schema'

function fill(doc: TemplateDocument, patches: Record<string, Record<string, unknown>>, events: Record<string, unknown> = {}) {
  let next = doc
  for (const [slot, props] of Object.entries(patches)) {
    const el = findBySlot(next, slot)
    if (el) next = updateElement(next, el.id, { props, ...(events[slot] ? { event: events[slot] as never } : {}) })
  }
  return next
}

const link = (p: string) => ({ action: 'OPEN_URL', target: `https://aim.example.com/${p}` })

/** 文档演示用的轻量示例（不依赖 Mock 包） */
export function buildSampleTemplatesLite(): TemplateDocument[] {
  return [
    fill(
      createDocument({ id: 'demo_image', layoutId: 'com.hbm.imageandtext', name: '国庆出游季', now: 0 }),
      {
        media: { src: sampleImage(5, 342, 192, '国庆出游季', '精选线路 限时直降') },
        title: { text: '国庆出游季 · 精选线路直降' },
        description: { text: '海岛、古镇、亲子乐园 300+ 线路限时特惠，提前预订再享早鸟立减。' },
        'button.0': { text: '立即抢购' },
      },
      { 'button.0': link('travel') },
    ),
    fill(
      createDocument({ id: 'demo_bill', layoutId: 'com.hbm.notification', name: '账单提醒', now: 0 }),
      {
        media: { src: sampleImage(5, 342, 120, '本月账单已出') },
        title: { text: '您的 10 月账单已出' },
        description: { text: '请于到期日前完成还款' },
        'kv.0.label': { text: '账单金额' },
        'kv.0.value': { text: '3,280.00 元' },
        'kv.1.label': { text: '到期日' },
        'kv.1.value': { text: '2026-11-05' },
        'button.0': { text: '账单明细' },
        'button.1': { text: '立即还款' },
      },
      { 'button.0': link('bill'), 'button.1': link('pay') },
    ),
    fill(createDocument({ id: 'demo_red', layoutId: 'com.hbm.redpacket', name: '品牌红包', now: 0 }), {
      name: { text: '梦网商城' },
      title: { text: '恭喜发财 大吉大利' },
      description: { text: '感谢一路相伴，送您一个专属红包。' },
    }),
  ]
}
