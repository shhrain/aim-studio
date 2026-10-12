import { VENDORS, type VendorId } from '@aim/template-schema'
import type { CSSProperties } from 'react'

export interface VendorTheme {
  id: string
  name: string
  shell: {
    frame: string
    /** 摄像头样式 */
    camera: 'punch-left' | 'punch-center' | 'notch' | 'waterdrop'
    screenBg: string
    headerBg: string
    headerColor: string
    inputBar: 'pill' | 'flat'
    statusTime: string
  }
  card: { bg: string; radius: number; border?: string }
  button: {
    primaryBg: string
    primaryColor: string
    secondaryBg: string
    secondaryColor: string
    /** 画布单位 */
    radius: number
    weight: number
    border?: string
  }
  accent: string
  price: string
}

const base: VendorTheme = {
  id: 'huawei',
  name: '华为',
  shell: { frame: '#1B1C1F', camera: 'punch-left', screenBg: '#F1F3F5', headerBg: '#F1F3F5', headerColor: '#1F2329', inputBar: 'pill', statusTime: '09:41' },
  card: { bg: '#FFFFFF', radius: 14 },
  button: { primaryBg: '#007DFF', primaryColor: '#FFFFFF', secondaryBg: '#F1F3F5', secondaryColor: '#007DFF', radius: 20, weight: 500 },
  accent: '#007DFF',
  price: '#E84026',
}

const themes = new Map<string, VendorTheme>()

/** 定义 / 覆盖厂商主题（业务可扩展新厂商或定制皮肤） */
export function defineVendorTheme(theme: Partial<VendorTheme> & { id: string; name?: string }): VendorTheme {
  const prev = themes.get(theme.id) ?? base
  const merged: VendorTheme = {
    ...prev,
    ...theme,
    name: theme.name ?? prev.name,
    shell: { ...prev.shell, ...theme.shell },
    card: { ...prev.card, ...theme.card },
    button: { ...prev.button, ...theme.button },
  }
  themes.set(theme.id, merged)
  return merged
}

defineVendorTheme({ ...base })
defineVendorTheme({
  id: 'honor',
  name: VENDORS.honor.name,
  shell: { ...base.shell, camera: 'punch-center' },
  button: { ...base.button, primaryBg: '#256FFF', secondaryColor: '#256FFF' },
  accent: '#256FFF',
  price: '#256FFF',
})
defineVendorTheme({
  id: 'xiaomi',
  name: VENDORS.xiaomi.name,
  shell: { ...base.shell, frame: '#050505', camera: 'punch-center', screenBg: '#FFFFFF', headerBg: '#FFFFFF', inputBar: 'flat' },
  card: { bg: '#F4F5F7', radius: 16 },
  button: { ...base.button, primaryBg: '#FFFFFF', primaryColor: '#111111', secondaryBg: '#FFFFFF', secondaryColor: '#111111', weight: 600 },
  accent: '#FF6900',
})
defineVendorTheme({
  id: 'vivo',
  name: VENDORS.vivo.name,
  shell: { ...base.shell, camera: 'waterdrop' },
  button: { ...base.button, primaryBg: 'transparent', primaryColor: '#3B9EFF', secondaryBg: 'transparent', secondaryColor: '#3B9EFF', weight: 500 },
  accent: '#3B9EFF',
})
defineVendorTheme({
  id: 'oppo',
  name: VENDORS.oppo.name,
  shell: { ...base.shell, camera: 'punch-left' },
  button: { ...base.button, primaryBg: '#FFFFFF', primaryColor: '#39BF56', secondaryBg: '#FFFFFF', secondaryColor: '#39BF56', border: '1px solid #E6E8EB' },
  accent: '#39BF56',
})
defineVendorTheme({
  id: 'samsung',
  name: VENDORS.samsung.name,
  shell: { ...base.shell, camera: 'punch-center', screenBg: '#F6F6F6', headerBg: '#F6F6F6' },
  button: { ...base.button, primaryBg: 'transparent', primaryColor: '#010101', secondaryBg: 'transparent', secondaryColor: '#010101', weight: 700 },
  accent: '#1428A0',
})
defineVendorTheme({
  id: 'asus',
  name: VENDORS.asus.name,
  shell: { ...base.shell, camera: 'notch' },
  button: { ...base.button, primaryBg: '#29BC52', primaryColor: '#FFFFFF', secondaryBg: '#E9F8EE', secondaryColor: '#29BC52', radius: 10 },
  accent: '#29BC52',
})
defineVendorTheme({
  id: 'coolpad',
  name: VENDORS.coolpad.name,
  shell: { ...base.shell, camera: 'waterdrop' },
  button: { ...base.button, primaryBg: '#0A7CFF', secondaryColor: '#0A7CFF', radius: 8 },
  accent: '#0A7CFF',
})

export function getVendorTheme(id: VendorId | string | undefined): VendorTheme {
  return themes.get(id ?? 'huawei') ?? base
}

export function listVendorThemes(): VendorTheme[] {
  return [...themes.values()]
}

/** 主题 → CSS 变量 */
export function themeVars(theme: VendorTheme): CSSProperties {
  return {
    '--aim-accent': theme.accent,
    '--aim-price': theme.price,
    '--aim-card-bg': theme.card.bg,
    '--aim-card-radius': theme.card.radius,
    '--aim-btn-bg': theme.button.primaryBg,
    '--aim-btn-color': theme.button.primaryColor,
    '--aim-btn2-bg': theme.button.secondaryBg,
    '--aim-btn2-color': theme.button.secondaryColor,
    '--aim-btn-radius': theme.button.radius,
    '--aim-btn-weight': theme.button.weight,
    '--aim-btn-border': theme.button.border ?? 'none',
    '--aim-screen-bg': theme.shell.screenBg,
    '--aim-header-bg': theme.shell.headerBg,
    '--aim-header-color': theme.shell.headerColor,
    '--aim-frame': theme.shell.frame,
  } as CSSProperties
}

/** 电商按钮配色（旧系统 themeColor 0-5） */
export const ECOMMERCE_PALETTE = {
  left: ['#F9A01E', '#F9A01E', '#A5D61D', '#61CFBE', '#AC49F5', '#3E3A39'],
  right: ['#E84026', '#E84026', '#F7CE00', '#46B1E3', '#0A59F7', '#EC008C'],
}
