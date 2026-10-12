/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIM → RCS（5G 消息 / iPhone）转换。
 * 与 5G 阅信体验平台 integrated-preview/convert/rcs.js 行为一致（见 test/parity.test.ts）。
 * 输入为旧编辑器同构的 content[]（可由 toLegacyContent(doc) 生成）。
 */
import type { RcsCardContent, RcsSourceMaterial, RcsSuggestion } from '@aim/template-schema'
import {
  AIM_CANVAS_WIDTH,
  CARD_IDS,
  CARD_TPL_IDS,
  CAROUSEL_IDS,
  DEFAULT_LAYOUT,
  DIALER_DETAIL,
  PARAM_INPUT_REG,
  RCS_ACTION_TYPE,
  RCS_URL_APPLICATION,
  REDPACKET_BG,
  REDPACKET_HEIGHT,
  REDPACKET_IDS,
  REDPACKET_WIDTH,
  SINGLE_MEDIA_IDS,
  UNSUPPORTED_RCS_ACTIONS,
} from './constants'
import { replaceSymbol } from './params'

export type LegacyElement = Record<string, any>
export interface LegacyParam {
  name: string
  example?: string
}

export function isRedpacket(cardId: string) {
  return REDPACKET_IDS.includes(cardId)
}

export function isCarousel(cardId: string) {
  return CAROUSEL_IDS.includes(cardId)
}

function splitContent(content: LegacyElement[]) {
  const pagesDB: LegacyElement[] = JSON.parse(JSON.stringify(content || []))
  return {
    pagesDB,
    buttons: pagesDB.filter((t) => t.type === 'button').reverse(),
    media: pagesDB.filter(
      (t) => t.type === 'image' || t.type === 'video' || t.type === 'audio' || t.type === 'swiper',
    ),
    texts: pagesDB.filter((t) => t.type === 'text'),
    swiper: pagesDB.filter((t) => t.type === 'swiper'),
  }
}

export function buildActionSheet(buttons: LegacyElement[]) {
  let actionShow = false
  const actionSheet: RcsSuggestion[] = JSON.parse(JSON.stringify(buttons || [])).map(
    (t: LegacyElement) => {
      if (!t.event) t.event = {}
      if (t.event.action === 'OPEN_QUICK') t.event.action = 'OPEN_BROWSER'
      if (t.event.action === 'OPEN_APP') t.event.action = 'OPEN_BROWSER'
      if (UNSUPPORTED_RCS_ACTIONS[t.event.action]) {
        actionShow = true
        t.event.action = 'OPEN_URL'
        t.event.target = ''
      }
      const type = RCS_ACTION_TYPE[t.event.action]
      return {
        type,
        name: replaceSymbol(t.text),
        actionDetail: JSON.stringify(
          type === 'urlAction'
            ? {
                url: replaceSymbol(t.event.target),
                application: RCS_URL_APPLICATION[t.event.action],
              }
            : JSON.parse(DIALER_DETAIL),
        ),
        action: replaceSymbol(t.event.target),
      }
    },
  )
  const editRcsBtns: (RcsSuggestion & { btIndex: number })[] = []
  actionSheet.forEach((t, index) => {
    if (!t.action) editRcsBtns.push({ btIndex: index, ...t })
  })
  return { actionSheet, actionShow, editRcsBtns }
}

interface RedpacketCtx {
  paramsLength: number
  btnFlag: boolean
  redpacketType: 1 | 2 | 3
}

export function getMedia(
  cardId: string,
  t: LegacyElement,
  texts: LegacyElement[],
  redpacketCtx: RedpacketCtx,
): RcsCardContent & { descriptionRms: string } {
  let workTexts = texts
  const texts1 = texts.filter((item) => item.title === 'true')
  let redpacketType = redpacketCtx.redpacketType || 1
  if (isRedpacket(cardId)) {
    workTexts = texts.filter((item) => item.title !== 'true')
    const redpacketTexts = texts1.find((item) => item.title === 'true') || {}
    redpacketType = 1
    if (redpacketCtx.paramsLength && (redpacketCtx.paramsLength > 1 || !redpacketCtx.btnFlag)) {
      redpacketType = 2
      if ((redpacketTexts.text || '').match(PARAM_INPUT_REG)) redpacketType = 3
    }
    redpacketCtx.redpacketType = redpacketType
  }
  const description: string = (workTexts[1] || {}).text || ''
  let descriptionRcs = description
  let descriptionRms = description
  if (cardId === CARD_IDS.NOTIFICATION) {
    const noticeList = texts.filter((item) => item.noticeList === 'true')
    noticeList.forEach((item, index) => {
      descriptionRcs += (index + 1) % 2 !== 0 ? `\n${item.text}：` : `${item.text}`
      descriptionRms += (index + 1) % 2 !== 0 ? `\n\n${item.text}：` : `${item.text}`
    })
  }
  const s1 = (t.src || '').split('.')
  const s2 = (t.src || '').split('/')
  return {
    media: {
      mtalType: t.type || 'image',
      mtalName: s2[s2.length - 1],
      mtalSize: t.size,
      mtalAddress: t.src,
      coverUrl: cardId === CARD_IDS.VIDEO ? t.cover : t.src,
      avatarUrl: t.avatarUrl,
      contentType: `image/${s1[s1.length - 1]}`,
      mtalHeight: t.h || t.height,
      mtalWidth: t.w || t.width,
    },
    description: descriptionRcs,
    descriptionRms,
    layout: DEFAULT_LAYOUT,
    title: (workTexts[0] || {}).text || '',
    avatartitle: (texts1[0] || {}).text,
  }
}

export function buildRedpacketOverlay({
  texts = [],
  avatar,
}: { texts?: LegacyElement[]; avatar?: LegacyElement } = {}) {
  const scale = REDPACKET_WIDTH / AIM_CANVAS_WIDTH
  function box(el: LegacyElement | undefined, fallbackFont: number) {
    if (!el) return null
    const style = el.style || {}
    const parsed = parseFloat(style.fontSize)
    const fontSize = Number.isFinite(parsed) ? parsed : fallbackFont
    return {
      x: Math.round((Number(el.x) || 0) * scale),
      y: Math.round((Number(el.y) || 0) * scale),
      w: Math.round((Number(el.w) || 0) * scale),
      h: Math.round((Number(el.h) || 0) * scale),
      fontSize: Math.round((fontSize || 14) * scale),
      color: style.color || '#ffffff',
      fontWeight: style.fontWeight || 700,
      textAlign: style.textAlign || 'center',
      fontFamily: style.fontFamily || '微软雅黑',
    }
  }
  const name = texts.find((item) => item.title === 'true')
  const body = texts.filter((item) => item.title !== 'true')
  return {
    avatar: box(avatar, 0),
    name: box(name, 20),
    title: box(body[0], 34),
    description: box(body[1], 20),
  }
}

export function getRedpacket(
  cardId: string,
  arr: LegacyElement[],
  texts: LegacyElement[],
  buttons: LegacyElement[],
  params: LegacyParam[],
) {
  if (!isRedpacket(cardId))
    return { content: [] as RcsCardContent[], redpacketType: 1 as const, btnFlag: false }
  const btnFlag = !!(buttons[0] && (buttons[0].event.target || '').match(PARAM_INPUT_REG))
  const foundBg = arr.find((t) => t.isBgimg)
  const img = arr.find((t) => !t.isBgimg)
  const bg = {
    ...(foundBg || { type: 'image', src: '', isBgimg: true }),
    height: REDPACKET_HEIGHT,
    width: REDPACKET_WIDTH,
    src:
      params.length && (params.length > 1 || !btnFlag) ? REDPACKET_BG.TYPE23 : REDPACKET_BG.TYPE1,
    avatarUrl: img ? img.src : '',
  }
  const redpacketCtx: RedpacketCtx = { paramsLength: params.length, btnFlag, redpacketType: 1 }
  const item = getMedia(cardId, bg, texts, redpacketCtx) as RcsCardContent & {
    descriptionRms: string
  }
  item.overlay = buildRedpacketOverlay({ texts, avatar: img })
  return { content: [item], redpacketType: redpacketCtx.redpacketType, btnFlag }
}

export function buildSourceMaterial({
  cardId,
  content,
  params = [],
}: {
  cardId: string
  content: LegacyElement[]
  params?: LegacyParam[]
}) {
  const { buttons, media, texts, swiper } = splitContent(content)
  const { actionSheet, actionShow, editRcsBtns } = buildActionSheet(buttons)
  const redpacketCtx: RedpacketCtx = {
    paramsLength: params.length,
    btnFlag: false,
    redpacketType: 1,
  }
  let redpacketType: 1 | 2 | 3 = 1
  let materialContent: (RcsCardContent & { descriptionRms?: string })[]
  if (SINGLE_MEDIA_IDS.includes(cardId)) {
    materialContent = media[0] ? [getMedia(cardId, media[0], texts, redpacketCtx)] : []
  } else if (swiper.length) {
    materialContent = (swiper[0]!.swiper.swiperArr || []).map((t: LegacyElement) =>
      getMedia(cardId, t, texts, redpacketCtx),
    )
  } else {
    const packed = getRedpacket(cardId, media, texts, buttons, params)
    materialContent = packed.content
    redpacketType = packed.redpacketType
  }
  const sourceMaterial: RcsSourceMaterial = {
    tplType: CARD_TPL_IDS.includes(cardId) ? 'card' : swiper.length ? 'multiCard' : 'media',
    actionSheet,
    params: params.length
      ? params.map((t, i) => ({
          pName: '${' + t.name + '}',
          pType: 'TEXT' as const,
          pLen: 100,
          pDesc: `${t.example}`,
          indices: [i],
        }))
      : undefined,
    content: materialContent,
  }
  return {
    sourceMaterial,
    actionShow,
    editRcsBtns,
    redpacketType,
    buttons,
    media,
    swiper,
    needCapture: isRedpacket(cardId),
  }
}

export function buildRcsTplContent(
  sourceMaterial: RcsSourceMaterial,
  cardId: string,
  redpacketType: number,
): RcsSourceMaterial {
  const tplContent: RcsSourceMaterial = JSON.parse(JSON.stringify(sourceMaterial || {}))
  if (tplContent.content) tplContent.content.forEach((t) => delete t.overlay)
  if (isRedpacket(cardId)) {
    if (redpacketType !== 1 && tplContent.content && tplContent.content[0]) {
      tplContent.content[0].buttons = tplContent.actionSheet
      delete tplContent.actionSheet
    }
    tplContent.tplType = redpacketType === 1 ? 'media' : 'card'
  } else if (tplContent.content) {
    tplContent.content.forEach((t) => {
      t.buttons = tplContent.actionSheet
    })
    delete tplContent.actionSheet
  }
  return tplContent
}
