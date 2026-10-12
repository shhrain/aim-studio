import { htmlParamsToTpl } from './params'
import { buildRcsTplContent, buildSourceMaterial, isCarousel } from './rcs'
import { buildRmsTplContent, getMediaContent } from './rms'
import { CAROUSEL_IDS } from './constants'

export { INTEGRATED_CARD_IDS, CARD_IDS, PREVIEW_WIDTH, AIM_CANVAS_WIDTH } from './constants'
export { htmlParamsToTpl } from './params'

export function convertToProtocols({ cardId, content, params = [] }) {
  const rcs = buildSourceMaterial({ cardId, content, params })
  const mediaForRms = isCarousel(cardId) && rcs.swiper[0]
    ? rcs.swiper[0].swiper.swiperArr
    : rcs.media
  const rms = getMediaContent({
    cardId,
    sourceMaterial: rcs.sourceMaterial,
    media: mediaForRms || [],
    buttons: rcs.buttons,
    redpacketType: rcs.redpacketType
  })
  const rcsTplContent = htmlParamsToTpl(buildRcsTplContent(rcs.sourceMaterial, cardId, rcs.redpacketType))
  const rmsTpl = htmlParamsToTpl(buildRmsTplContent(rms.mediaContent, params))
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
    rmsTplParams: rmsTpl.params
  }
}

export function applyCapturedImage(result, { rmsSrc, rcsSrc }) {
  const next = JSON.parse(JSON.stringify(result))
  if (next.mediaContent && next.mediaContent[0] && rmsSrc) {
    next.mediaContent[0].src = rmsSrc
  }
  if (next.sourceMaterial && next.sourceMaterial.content && next.sourceMaterial.content[0] && rcsSrc) {
    next.sourceMaterial.content[0].media.mtalAddress = rcsSrc
    next.sourceMaterial.content[0].media.coverUrl = rcsSrc
    next.sourceMaterial.content[0].overlayCaptured = true
  }
  if (next.rcsTplContent && next.rcsTplContent.content && next.rcsTplContent.content[0] && rcsSrc) {
    next.rcsTplContent.content[0].media.mtalAddress = rcsSrc
    next.rcsTplContent.content[0].media.coverUrl = rcsSrc
  }
  if (next.rmsTplContent && next.rmsTplContent[0] && rmsSrc) {
    next.rmsTplContent[0].mtalAddress = rmsSrc
  }
  next.needCapture = false
  return next
}

export function buildSubmitPayload(result, extras = {}) {
  return {
    rcsTplRequest: {
      tplName: extras.tplName || '',
      chatbotNameId: extras.chatbotNameId || '',
      chatbotName: extras.chatbotName || '',
      tplContent: result.rcsTplContent
    },
    rmsTplRequest: {
      tplName: extras.rmsTitle || result.rmsTitle || '',
      signature: extras.signature || '',
      content: result.rmsTplContent,
      params: result.rmsTplParams
    }
  }
}

export { CAROUSEL_IDS }
