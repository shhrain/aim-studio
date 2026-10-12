import { z } from 'zod'

export const VENDOR_IDS = [
  'huawei',
  'honor',
  'xiaomi',
  'vivo',
  'oppo',
  'samsung',
  'asus',
  'coolpad',
] as const
export type VendorId = (typeof VENDOR_IDS)[number]
export const vendorIdSchema = z.enum(VENDOR_IDS)

export interface VendorMeta {
  id: VendorId
  name: string
  /** 品牌色（用于标签、图标底色） */
  brandColor: string
  /** 旧数据中的 factoryType（`isXiaomi` 用 2 表示） */
  legacyFactoryType: number
  /** 审核耗时说明（帮助中心“审核时间”） */
  reviewTime: string
}

export const VENDORS: Record<VendorId, VendorMeta> = {
  huawei: {
    id: 'huawei',
    name: '华为',
    brandColor: '#C7000B',
    legacyFactoryType: 1,
    reviewTime: '加急 1-2 小时，常规上/下午集中审核',
  },
  honor: {
    id: 'honor',
    name: '荣耀',
    brandColor: '#1A1A1A',
    legacyFactoryType: 7,
    reviewTime: '免审',
  },
  xiaomi: {
    id: 'xiaomi',
    name: '小米',
    brandColor: '#FF6900',
    legacyFactoryType: 2,
    reviewTime: '免审',
  },
  vivo: {
    id: 'vivo',
    name: 'vivo',
    brandColor: '#415FFF',
    legacyFactoryType: 4,
    reviewTime: '免审',
  },
  oppo: {
    id: 'oppo',
    name: 'OPPO',
    brandColor: '#1F8A4C',
    legacyFactoryType: 3,
    reviewTime: '免审',
  },
  samsung: {
    id: 'samsung',
    name: '三星',
    brandColor: '#1428A0',
    legacyFactoryType: 6,
    reviewTime: '1 个工作日',
  },
  asus: {
    id: 'asus',
    name: '华硕',
    brandColor: '#00539B',
    legacyFactoryType: 5,
    reviewTime: '1 个工作日',
  },
  coolpad: {
    id: 'coolpad',
    name: '酷派',
    brandColor: '#0A7CFF',
    legacyFactoryType: 8,
    reviewTime: '1 个工作日',
  },
}

export const VENDOR_LIST: VendorMeta[] = VENDOR_IDS.map((id) => VENDORS[id])

/** 根据旧数据 factoryType / isXiaomi 推断厂商 */
export function vendorFromLegacy(factoryType?: number, isXiaomi?: boolean): VendorId {
  if (isXiaomi) return 'xiaomi'
  return VENDOR_LIST.find((v) => v.legacyFactoryType === factoryType)?.id ?? 'huawei'
}

/** 常用厂商组合 */
export const VENDOR_SETS = {
  all: [...VENDOR_IDS] as VendorId[],
  main: ['huawei', 'honor', 'xiaomi', 'vivo', 'oppo', 'samsung', 'asus'] as VendorId[],
  core: ['huawei', 'honor', 'xiaomi', 'vivo', 'oppo'] as VendorId[],
  huaweiFamily: ['huawei', 'honor'] as VendorId[],
}
