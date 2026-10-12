import { sampleImage } from '@aim/template-core'
import { LAYOUTS, VENDOR_LIST } from '@aim/template-schema'
import type { FilterOptions, Material } from '@aim/api-client'

import { SAMPLE_VIDEO } from './templates'

export * from './templates'

export const INDUSTRIES = [
  { id: 'retail', name: '零售电商' },
  { id: 'finance', name: '金融保险' },
  { id: 'travel', name: '旅游出行' },
  { id: 'digital', name: '数码家电' },
  { id: 'logistics', name: '物流快递' },
  { id: 'telecom', name: '通信运营' },
  { id: 'internet', name: '互联网' },
  { id: 'auto', name: '汽车' },
]

export const CARRIERS = [
  { id: '移动', name: '中国移动' },
  { id: '联通', name: '中国联通' },
  { id: '电信', name: '中国电信' },
]

export function filterOptions(): FilterOptions {
  const styles = [...new Map(LAYOUTS.filter((l) => !l.free).map((l) => [l.id, { id: l.id, name: l.name }])).values()]
  return {
    industries: INDUSTRIES,
    styles,
    labels: ['节日营销', '限时特惠', '新品发布', '红包', '通知', '卡券', '会员关怀', '出行', '电商', '问卷', '验证码', '大促'].map((n) => ({ id: n, name: n })),
    carriers: CARRIERS,
    factories: VENDOR_LIST.map((v) => ({ id: v.id, name: v.name })),
  }
}

/** 素材库种子 */
export function seedMaterials(now = Date.now()): Material[] {
  const titles = ['品牌主视觉', '新品首发', '会员日', '秋季上新', '限时折扣', '节日海报', '店铺横幅', '活动 Banner', '产品特写', '生活方式']
  const images: Material[] = titles.map((name, i) => ({
    id: `mat_img_${i}`,
    type: 'image',
    name,
    url: sampleImage(i, 342, i % 3 === 0 ? 342 : 192, name),
    width: 342,
    height: i % 3 === 0 ? 342 : 192,
    size: 120_000 + i * 8_000,
    createdAt: now - i * 3_600_000,
    tags: ['示例'],
  }))
  const videos: Material[] = ['品牌宣传片', '产品演示', '直播回放'].map((name, i) => ({
    id: `mat_video_${i}`,
    type: 'video',
    name,
    url: SAMPLE_VIDEO,
    cover: sampleImage(i + 3, 342, 192, name, '示例视频'),
    width: 1280,
    height: 720,
    size: 4_800_000,
    duration: 30 + i * 15,
    createdAt: now - i * 7_200_000,
    tags: ['示例'],
  }))
  return [...images, ...videos]
}
