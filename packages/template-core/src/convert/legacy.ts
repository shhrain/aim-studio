/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 旧数据适配：TemplateDocument ⇄ 旧编辑器 pages / content[]
 * - toLegacyContent：供三信融合转换器使用（与旧编辑器 content 同构）
 * - fromLegacyPages：导入历史模板（tplContent.pages 字符串）
 */
import {
  ELEMENT_TYPES,
  SCHEMA_VERSION,
  defaultLayoutSettings,
  getLayout,
  requireLayout,
  type AnyElement,
  type ElementType,
  type TemplateDocument,
  type TemplateParam,
} from '@aim/template-schema'
import { uid } from '@aim/utils'
import { createParam } from '@aim/template-schema'
import { PARAM_NAME_REG, PARAM_TOKEN_REG, REDPACKET_IDS } from './constants'
import type { LegacyElement } from './rcs'

/** {#x#} → 旧编辑器参数节点 */
export function tokensToLegacyHtml(text: string | undefined): string {
  return (text ?? '').replace(
    PARAM_TOKEN_REG,
    (_, n: string) => `<input type="button" class="param-btn" value="{#${n}#}" readonly>`,
  )
}

/** 旧编辑器参数节点 → {#x#} */
export function legacyHtmlToTokens(text: string | undefined): string {
  return (text ?? '').replace(PARAM_NAME_REG, (_: string, __: string, n: string) => `{#${n}#}`)
}

const px = (v: number | undefined) => (v == null ? undefined : `${v}px`)

function legacyStyle(el: AnyElement) {
  const s = el.style ?? {}
  return { ...s, fontSize: px(s.fontSize), borderRadius: s.borderRadius }
}

function toLegacyElement(el: AnyElement, cardId: string): LegacyElement {
  const base = {
    type: el.type,
    x: el.x,
    y: el.y,
    w: el.w,
    h: el.h,
    z: el.z,
    visible: el.visible,
    style: legacyStyle(el),
    event: el.event,
  }
  switch (el.type) {
    case 'text':
      return {
        ...base,
        text: tokensToLegacyHtml(el.props.text),
        title: REDPACKET_IDS.includes(cardId) && el.slot === 'name' ? 'true' : undefined,
        noticeList: el.slot?.startsWith('kv.') ? 'true' : undefined,
      }
    case 'image':
      return {
        ...base,
        src: el.props.srcParam ? tokensToLegacyHtml(el.props.srcParam) : el.props.src,
        size: 0,
        isBgimg: el.props.role === 'background' ? true : undefined,
      }
    case 'video':
      return {
        ...base,
        src: el.props.src,
        cover: el.props.cover,
        size: el.props.size ?? 0,
        duration: el.props.duration,
      }
    case 'audio':
      return { ...base, src: el.props.src, title: el.props.title, duration: el.props.duration }
    case 'button':
      return {
        ...base,
        text: tokensToLegacyHtml(el.props.text),
        event: el.event
          ? { ...el.event, target: tokensToLegacyHtml(String(el.event.target ?? '')) }
          : { action: 'OPEN_URL', target: '' },
      }
    case 'swiper':
      return {
        ...base,
        resourcesType: el.props.resourceType,
        proportion: el.props.ratio,
        swiper: {
          loop: el.props.loop,
          interval: el.props.interval,
          showIndicatorPoint: el.props.indicator,
          swiperArr: el.props.items.map((it) => ({
            type: el.props.resourceType === 'video' ? 'video' : 'image',
            src: it.src,
            cover: it.cover,
            w: el.w,
            h: el.h,
            size: 0,
            event: it.event ?? { action: 'OPEN_URL', target: '' },
          })),
        },
      }
    default:
      return { ...base, ...el.props }
  }
}

/** 文档首页 → 旧 content[]（按钮逆序，与旧编辑器存储顺序一致） */
export function toLegacyContent(doc: TemplateDocument, pageIndex = 0): LegacyElement[] {
  const page = doc.pages[pageIndex]
  if (!page) return []
  const visible = page.elements.filter((e) => e.visible).sort((a, b) => a.y - b.y || a.x - b.x)
  const others = visible.filter((e) => e.type !== 'button')
  const buttons = visible.filter((e) => e.type === 'button').reverse()
  return [...others, ...buttons].map((el) => toLegacyElement(el, doc.cardId))
}

/** 文档 → 旧 pages（可写回旧系统 tplContent.pages） */
export function toLegacyPages(doc: TemplateDocument) {
  return doc.pages.map((p, i) => ({
    cardId: doc.cardId,
    style: { ...p.style, height: `${p.style.height}px` },
    content: toLegacyContent(doc, i),
  }))
}

/* ------------------------------------------------------------------ */
/* 导入                                                                 */
/* ------------------------------------------------------------------ */

const num = (v: unknown, d = 0) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : d
}

function fromLegacyStyle(style: Record<string, any> = {}) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(style)) {
    if (v == null || v === '') continue
    if (['fontSize', 'borderRadius', 'borderWidth', 'padding', 'letterSpacing'].includes(k))
      out[k] = num(v)
    else if (k === 'lineHeight') out[k] = num(v, 1.5)
    else if (
      [
        'color',
        'backgroundColor',
        'textAlign',
        'fontWeight',
        'borderColor',
        'borderStyle',
      ].includes(k)
    )
      out[k] = v
  }
  return out
}

function fromLegacyElement(item: LegacyElement): AnyElement | null {
  const type = item.type as ElementType
  if (!ELEMENT_TYPES.includes(type)) return null
  const base = {
    id: uid('el'),
    x: num(item.x),
    y: num(item.y),
    w: num(item.w, 100),
    h: num(item.h, 30),
    z: num(item.z),
    angle: num(item.angle),
    visible: item.visible !== false,
    locked: Boolean(item.locked),
    style: fromLegacyStyle(item.style),
    event: item.event?.action
      ? { ...item.event, target: legacyHtmlToTokens(item.event.target) }
      : undefined,
  }
  let props: Record<string, any>
  switch (type) {
    case 'text':
      props = { text: legacyHtmlToTokens(item.text) }
      break
    case 'image':
      props = { src: item.src ?? '', fit: 'cover', role: item.isBgimg ? 'background' : 'content' }
      break
    case 'video':
      props = {
        src: item.src ?? '',
        cover: item.cover ?? '',
        duration: item.duration,
        size: item.size,
      }
      break
    case 'audio':
      props = { src: item.src ?? '', title: item.title ?? '', duration: num(item.duration) }
      break
    case 'button':
      props = { text: legacyHtmlToTokens(item.text), variant: 'primary' }
      break
    case 'qrCode':
      props = { src: item.src ?? '' }
      break
    case 'swiper': {
      const s = item.swiper ?? {}
      props = {
        items: (s.swiperArr ?? []).map((it: any) => ({
          src: it.src ?? '',
          cover: it.cover,
          event: it.event ?? (it.action ? { action: it.action, target: it.target } : undefined),
        })),
        resourceType: item.resourcesType === 'video' ? 'video' : 'image',
        ratio: Array.isArray(item.proportion) ? item.proportion : [16, 9],
        loop: s.loop ?? true,
        autoplay: true,
        interval: num(s.interval, 3),
        indicator: s.showIndicatorPoint ?? true,
      }
      break
    }
    case 'sideslip': {
      const s = item.sideslip ?? {}
      const [a, b] = String(s.proportion ?? '16:9')
        .split(':')
        .map(Number)
      props = {
        ratio: [a || 16, b || 9],
        showContent: item.contentShow ?? true,
        cards: (s.sideslipList ?? []).map((c: any) => ({
          src: c.src ?? '',
          title: c.title ?? '',
          content: c.content ?? '',
          buttons: (c.buts ?? []).map((bt: any) => ({
            text: bt.text ?? '',
            event: bt.action ? { action: bt.action, target: bt.target } : undefined,
          })),
        })),
      }
      break
    }
    case 'eCommerce': {
      const c = item.content ?? {}
      props = {
        media: c.video?.visibility === 'visible' ? 'video' : 'image',
        images: (c.imageList?.listItem ?? []).map((it: any) => ({
          src: it.image?.src ?? '',
          event: it.action ? { action: it.action, target: it.target } : undefined,
        })),
        video: c.video ? { src: c.video.src ?? '', cover: c.video.cover ?? '' } : undefined,
        currency: c.divTextArea1?.currencyText?.textValue ?? '¥',
        price: c.divTextArea1?.text1?.textValue ?? '',
        tag: c.divTextArea1?.text2?.textValue,
        title: c.divTextArea2?.textTitle?.textValue ?? '',
        description: c.divTextArea2?.textContent?.textValue ?? '',
        buttons: (c.divButton ?? []).map((b: any) => ({ text: b.textValue ?? '', event: b.event })),
        themeColor: num(c.themeColor),
      }
      break
    }
    case 'countdown':
      props = { endTime: num(item.countdown?.endTime, Date.now()), label: '距活动结束' }
      break
    case 'tel':
      props = {
        styleType: item.styleType ?? 'text',
        text: item.text ?? '',
        phone: item.event?.target ?? '',
        image: item.iconImage,
      }
      break
    case 'map':
      props = {
        mode: 'text',
        title: item.query?.title ?? '',
        address: item.query?.address ?? '',
        longitude: num(item.query?.lng),
        latitude: num(item.query?.lat),
      }
      break
    default: {
      const { type: _t, x: _x, y: _y, w: _w, h: _h, style: _s, event: _e, ...rest } = item
      props = rest
    }
  }
  return { ...base, type, props } as AnyElement
}

/** 推断槽位（结构化版式） */
function inferSlots(elements: AnyElement[], legacy: LegacyElement[], layoutId: string) {
  const isRed = REDPACKET_IDS.includes(layoutId) || layoutId === 'com.hbm.redpacketPersonal'
  let textIndex = 0
  let kvIndex = 0
  let mediaAssigned = false
  const buttons = elements.filter((e) => e.type === 'button').sort((a, b) => a.y - b.y || a.x - b.x)
  elements.forEach((el, i) => {
    const src = legacy[i] ?? {}
    if (el.type === 'text') {
      if (isRed && src.title === 'true') el.slot = 'name'
      else if (src.noticeList === 'true') {
        el.slot = `kv.${Math.floor(kvIndex / 2)}.${kvIndex % 2 === 0 ? 'label' : 'value'}`
        kvIndex++
      } else {
        el.slot = ['title', 'description'][textIndex++]
      }
    } else if (el.type === 'image' && el.props.role === 'background') el.slot = 'background'
    else if (['image', 'video', 'swiper'].includes(el.type) && !mediaAssigned) {
      el.slot = isRed ? 'avatar' : 'media'
      mediaAssigned = true
    } else if (el.type === 'button') el.slot = `button.${buttons.indexOf(el)}`
  })
}

export interface FromLegacyOptions {
  cardId?: string
  name?: string
  params?: { name: string; example?: string }[]
  vendors?: TemplateDocument['vendors']
  id?: string
}

/** 导入旧模板：pages 可为 JSON 字符串或数组 */
export function fromLegacyPages(
  pages: string | any[],
  options: FromLegacyOptions = {},
): TemplateDocument {
  const list: any[] = typeof pages === 'string' ? JSON.parse(pages) : pages
  const first = list[0] ?? {}
  const cardId: string = options.cardId ?? first.cardId ?? 'com.hbm.custom'
  const layout = getLayout(cardId) ?? requireLayout('com.hbm.custom')
  const now = Date.now()
  const docPages = list.map((p) => {
    const content: LegacyElement[] = (p.content ?? []).filter((c: LegacyElement) =>
      ELEMENT_TYPES.includes(c.type),
    )
    const elements = content.map(fromLegacyElement).filter((e): e is AnyElement => e !== null)
    if (!layout.free) inferSlots(elements, content, cardId)
    const height = num(p.style?.height, Math.max(120, ...elements.map((e) => e.y + e.h)))
    return {
      id: uid('page'),
      mode: 'absolute' as const,
      style: {
        height,
        backgroundColor: p.style?.backgroundColor || '#FFFFFF',
        backgroundImage: p.style?.backgroundImage || undefined,
        borderRadius: 12,
      },
      elements,
    }
  })
  const params: TemplateParam[] = (options.params ?? []).map((p) => ({
    ...createParam(p.name),
    example: p.example ?? '',
  }))
  return {
    schemaVersion: SCHEMA_VERSION,
    id: options.id ?? uid('tpl'),
    name: options.name ?? '',
    usage: 'commercial',
    category: layout.category,
    layoutId: layout.id,
    cardId,
    vendors: options.vendors ?? [...layout.vendors],
    recognition: 'shortLink',
    params,
    settings: defaultLayoutSettings(layout),
    pages: docPages.length
      ? docPages
      : [{ id: uid('page'), mode: 'absolute', style: { height: 420 }, elements: [] }],
    meta: { status: 'draft', createdAt: now, updatedAt: now },
  }
}
