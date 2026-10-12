import type { IntegratedResult, SubmitPayload, TemplateDocument } from '@aim/template-schema'
import { CAROUSEL_IDS, INTEGRATED_CARD_IDS } from './constants'
import { toLegacyContent } from './legacy'
import { htmlParamsToTpl } from './params'
import {
  buildRcsTplContent,
  buildSourceMaterial,
  isCarousel,
  type LegacyElement,
  type LegacyParam,
} from './rcs'
import { buildRmsTplContent, getMediaContent } from './rms'

export * from './constants'
export * from './legacy'
export {
  getTextParam,
  htmlParamsToTpl,
  isValidHttpsUrl,
  replaceSymbol,
  stripDynamicParams,
  stripReject,
} from './params'
export {
  buildActionSheet,
  buildRcsTplContent,
  buildRedpacketOverlay,
  buildSourceMaterial,
  isCarousel,
  isRedpacket,
} from './rcs'
export type { LegacyElement, LegacyParam } from './rcs'
export { buildRmsTplContent, getMediaContent, mergeAdjacentTextFrames } from './rms'

/**
 * 三信融合转换（旧接口）：content[] → RCS + RMS。
 * 与 5G 阅信体验平台 convertToProtocols 输出一致。
 */
export function convertToProtocols({
  cardId,
  content,
  params = [],
  mode = 'legacy',
}: {
  cardId: string
  content: LegacyElement[]
  params?: LegacyParam[]
  /** legacy：与旧实现逐字段一致；fixed：修正多层转义参数等历史问题 */
  mode?: 'legacy' | 'fixed'
}): IntegratedResult {
  const rcs = buildSourceMaterial({ cardId, content, params })
  const mediaForRms =
    isCarousel(cardId) && rcs.swiper[0] ? rcs.swiper[0].swiper.swiperArr : rcs.media
  const rms = getMediaContent({
    cardId,
    sourceMaterial: rcs.sourceMaterial,
    media: mediaForRms || [],
    buttons: rcs.buttons,
    redpacketType: rcs.redpacketType,
    mode,
  })
  const rcsTplContent = htmlParamsToTpl(
    buildRcsTplContent(rcs.sourceMaterial, cardId, rcs.redpacketType),
    mode,
  )
  const rmsTpl = htmlParamsToTpl(buildRmsTplContent(rms.mediaContent, params), mode)
  return {
    sourceMaterial: rcs.sourceMaterial,
    mediaContent: rms.mediaContent,
    rmsTitle: rms.rmsTitle,
    redpacketType: rcs.redpacketType,
    actionShow: rcs.actionShow,
    editRcsBtns: rcs.editRcsBtns,
    needCapture: rcs.needCapture,
    rcsTplContent,
    rmsTplContent: rmsTpl.content,
    rmsTplParams: rmsTpl.params,
  }
}

/** 版式是否支持三信融合（RCS / RMS） */
export function supportsIntegrated(cardId: string): boolean {
  return INTEGRATED_CARD_IDS.includes(cardId)
}

/** 新文档 → 三信融合协议（不支持的版式返回 null） */
export function convertDocument(doc: TemplateDocument): IntegratedResult | null {
  if (!supportsIntegrated(doc.cardId)) return null
  return convertToProtocols({
    cardId: doc.cardId,
    content: toLegacyContent(doc),
    params: doc.params.map((p) => ({ name: p.name, example: p.example })),
    mode: 'fixed',
  })
}

/** 红包截图完成后回填审核图 */
export function applyCapturedImage(
  result: IntegratedResult,
  { rmsSrc, rcsSrc }: { rmsSrc?: string; rcsSrc?: string },
): IntegratedResult {
  const next: IntegratedResult = JSON.parse(JSON.stringify(result))
  if (next.mediaContent?.[0] && rmsSrc) next.mediaContent[0].src = rmsSrc
  const rcsFirst = next.sourceMaterial?.content?.[0]
  if (rcsFirst && rcsSrc) {
    rcsFirst.media.mtalAddress = rcsSrc
    rcsFirst.media.coverUrl = rcsSrc
    rcsFirst.overlayCaptured = true
  }
  const tplFirst = next.rcsTplContent?.content?.[0]
  if (tplFirst && rcsSrc) {
    tplFirst.media.mtalAddress = rcsSrc
    tplFirst.media.coverUrl = rcsSrc
  }
  if (next.rmsTplContent?.[0] && rmsSrc) next.rmsTplContent[0].mtalAddress = rmsSrc
  next.needCapture = false
  return next
}

/** 组装提交审核载荷 */
export function buildSubmitPayload(
  result: IntegratedResult,
  extras: {
    tplName?: string
    chatbotNameId?: string
    chatbotName?: string
    rmsTitle?: string
    signature?: string
  } = {},
): SubmitPayload {
  return {
    rcsTplRequest: {
      tplName: extras.tplName || '',
      chatbotNameId: extras.chatbotNameId || '',
      chatbotName: extras.chatbotName || '',
      tplContent: result.rcsTplContent,
    },
    rmsTplRequest: {
      tplName: extras.rmsTitle || result.rmsTitle || '',
      signature: extras.signature || '',
      content: result.rmsTplContent,
      params: result.rmsTplParams,
    },
  }
}

export { CAROUSEL_IDS }
