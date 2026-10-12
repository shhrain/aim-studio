/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AIM → RMS（视频短信 / 其他终端）转换。
 * 与 5G 阅信体验平台 integrated-preview/convert/rms.js 行为一致（见 test/parity.test.ts）。
 */
import type { RcsSourceMaterial, RmsFrame, RmsParam, RmsTplFrame } from '@aim/template-schema'
import {
  CARD_IDS,
  CAROUSEL_IDS,
  REDPACKET_IDS,
  RMS_CANVAS_WIDTH,
  SINGLE_MEDIA_IDS,
} from './constants'
import { isValidHttpsUrl, replaceSymbol, stripDynamicParams, stripReject } from './params'
import type { LegacyElement, LegacyParam } from './rcs'

function replaceRmsSymbol(value: string | undefined | null): string {
  if (!value) return value as string
  const withBreaks = String(value).replace(/<br\s*\/?>/gi, '\n')
  return replaceSymbol(withBreaks).replace(/<br\s*\/?>/gi, '\n')
}

export function resetBaseContent(
  type: string,
  count: number | string,
  payload: any,
): RmsFrame | null {
  switch (type) {
    case 'text':
      return {
        active: false,
        type: 'text',
        text: stripReject(payload || '请输入文本'),
        tag: 'text_' + count,
        image: {
          src: '',
          width: '',
          height: '',
          ratio: '',
          w: 260,
          h: 0,
          size: 0,
          compoundSize: 0,
          textEditable: [],
        },
        audio: {
          src: '',
          duration: 0,
          title: '',
          size: 0,
          w: 240,
          h: 70,
          style: { color: '#333', backgroundColor: '#fff', transparency: 0 },
        },
        video: { w: 260, h: 142, src: '', width: 0, height: 0, duration: 0, size: 0 },
        imgParam: { src: '', figure: '' },
        textPosition: 'top',
      }
    case 'audio':
      return {
        active: false,
        type: 'audio',
        src: payload.mtalAddress,
        text: payload.content || '',
        duration: payload.duration,
        title: (payload.mtalName || '').slice(0, 20),
        size: payload.mtalSize,
        w: 240,
        h: 70,
        containText: payload.content ? 'show' : 'hide',
        canClick: true,
        textPosition: payload.textPosition || 'bottom',
      }
    case 'video':
      return {
        active: false,
        type: 'video',
        text: payload.content || '',
        w: 260,
        h: 142,
        containText: payload.content ? 'show' : 'hide',
        canClick: true,
        src: payload.mtalAddress,
        width: payload.mtalWidth,
        height: payload.mtalHeight,
        duration: payload.duration,
        size: payload.mtalSize,
        fistFramePath: payload.coverUrl,
        textPosition: payload.textPosition || 'bottom',
      }
    case 'image':
    case 'swiper': {
      const showW = payload.mtalWidth >= RMS_CANVAS_WIDTH ? RMS_CANVAS_WIDTH : payload.mtalWidth
      const showH =
        payload.mtalWidth >= RMS_CANVAS_WIDTH
          ? Math.floor((RMS_CANVAS_WIDTH / payload.mtalWidth) * payload.mtalHeight)
          : payload.mtalHeight
      return {
        active: false,
        type: 'image',
        src: payload.mtalAddress,
        size: payload.mtalSize,
        compoundSize: 0,
        width: payload.mtalWidth,
        height: payload.mtalHeight,
        w: showW,
        h: showH,
        tag: `image_` + count,
        borderRadius: 0,
        text: payload.content || '',
        containText: payload.content ? 'show' : 'hide',
        canClick: true,
        textEditable: [],
        textPosition: payload.textPosition || 'bottom',
      }
    }
    default:
      return null
  }
}

export function mergeAdjacentTextFrames(frames: (RmsFrame | null)[]): RmsFrame[] {
  const result: RmsFrame[] = []
  ;(frames || []).forEach((frame) => {
    if (!frame) return
    if (frame.type !== 'text') {
      result.push(frame)
      return
    }
    const nextText = String(frame.text || '').replace(/^[\s\n]+|[\s\n]+$/g, '')
    if (!nextText) return
    const last = result[result.length - 1]
    if (last && last.type === 'text') {
      last.text = String(last.text || '').replace(/[\s\n]+$/g, '') + '\n\n' + nextText
    } else {
      result.push({ ...frame, text: nextText })
    }
  })
  return result
}

export function getMediaContent({
  cardId,
  sourceMaterial,
  media,
  buttons,
  redpacketType,
  mode = 'legacy',
}: {
  cardId: string
  sourceMaterial: RcsSourceMaterial
  media: LegacyElement[]
  buttons: LegacyElement[]
  redpacketType: number
  mode?: 'legacy' | 'fixed'
}) {
  const date = +new Date()
  const mediaContent: (RmsFrame | null)[] = []
  const sourceMaterialDB = JSON.parse(
    stripReject(JSON.stringify(sourceMaterial || { content: [] })),
  )
  const first = (sourceMaterialDB.content && sourceMaterialDB.content[0]) || {}
  const rmsTitle = `${stripDynamicParams(first.title || '')}`

  ;(sourceMaterialDB.content || []).forEach(({ descriptionRms, ...t }: any, i: number) => {
    if (sourceMaterial.content && sourceMaterial.content[i])
      delete (sourceMaterial.content[i] as any).descriptionRms
    if (t.type === 'location') {
      if (t.text && typeof JSON.parse(t.text) === 'object') {
        const loc = JSON.parse(replaceSymbol(t.text))
        mediaContent.push(
          resetBaseContent('text', date + i, `地址：${loc.title}\n经纬度：${loc.lng},${loc.lat}`),
        )
      }
      return
    }
    if (!t || JSON.stringify(t) === '{}') return
    if (t.media && JSON.stringify(t.media) !== '{}') {
      if (t.media.mtalType === 'file') return
      mediaContent.push(resetBaseContent(`${t.media.mtalType}`, date + i, t.media))
    }
    if (
      (t.title || t.description || t.type === 'text') &&
      sourceMaterialDB.content.length - 1 === i
    ) {
      if (cardId === CARD_IDS.NOTIFICATION) t.description = descriptionRms || t.description
      if (REDPACKET_IDS.includes(cardId) && redpacketType === 1) return
      let textPayload: string
      if (t.type === 'text') {
        textPayload = stripDynamicParams(replaceRmsSymbol(t.text))
      } else if (REDPACKET_IDS.includes(cardId)) {
        textPayload = stripDynamicParams(
          (redpacketType === 3 ? '【' + t.avatartitle + '】' : '') +
            replaceRmsSymbol(t.description) +
            '\n\n',
        )
      } else {
        textPayload = stripDynamicParams(replaceRmsSymbol(t.description) + '\n\n')
      }
      mediaContent.push(resetBaseContent('text', date + i, textPayload))
    }
    if (t.media && JSON.stringify(t.media) !== '{}' && t.media.mtalType !== 'file') {
      media.forEach((tj, ii) => {
        const matchCard =
          (REDPACKET_IDS.includes(cardId) && !tj.isBgimg) ||
          (CAROUSEL_IDS.includes(cardId) && media.length - 1 === i) ||
          SINGLE_MEDIA_IDS.includes(cardId)
        if (!matchCard) return
        // 旧实现在媒体缺少 event 时会抛错；此处跳过无跳转的媒体（fixed 模式下空链接也跳过）
        if (!tj.event || (mode === 'fixed' && !tj.event.target)) return
        const flag =
          cardId === CARD_IDS.VIDEO
            ? false
            : buttons.every((tk) => (tk.event && tk.event.target) !== (tj.event && tj.event.target))
        if (flag) {
          mediaContent.push(
            resetBaseContent(
              'text',
              date + i + `${ii}`,
              `点击查看: \n${stripDynamicParams(replaceRmsSymbol(tj.event.target))}`,
            ),
          )
        }
      })
    }
  })

  if (buttons.length) {
    buttons.forEach((t, i) => {
      if (t.event && t.event.action === 'OPEN_QUICK')
        t.event.target = (t.event.target || '').replace(/^hap:\/\//, 'https://hapjs.org/')
      if (t.event && t.event.action === 'OPEN_APP')
        t.event.target = `https://twise.cn/toApp.html?toApp=${t.event.target}`
      const target = replaceRmsSymbol(t.event && t.event.target)
      mediaContent.push(
        resetBaseContent(
          'text',
          date + 990 + i,
          `${stripDynamicParams(replaceRmsSymbol(t.text))}:${isValidHttpsUrl(target) ? '\n' : ''}${stripDynamicParams(target)}`,
        ),
      )
    })
  }
  if (cardId === CARD_IDS.NOTIFICATION && mediaContent.length)
    mediaContent.push(mediaContent.shift()!)
  return { mediaContent: mergeAdjacentTextFrames(mediaContent), rmsTitle }
}

export function selectParam(type: string, payload: any): RmsTplFrame | null {
  switch (type) {
    case 'text':
      return { type: 'txt', content: payload.text }
    case 'audio':
      return {
        mtalAddress: payload.src,
        duration: payload.duration,
        mtalName: payload.title,
        mtalSize: payload.size,
        type: 'audio',
        textPosition: payload.textPosition,
        content: payload.text,
      }
    case 'video':
      return {
        mtalAddress: payload.src,
        duration: payload.duration,
        fistFramePath: payload.coverUrl || payload.fistFramePath,
        mtalSize: payload.size,
        mtalWidth: payload.width,
        mtalHeight: payload.height,
        type: 'video',
        textPosition: payload.textPosition,
        content: payload.text,
      }
    case 'image':
      return {
        mtalAddress: payload.src,
        mtalSize: payload.size,
        mtalWidth: payload.width,
        mtalHeight: payload.height,
        type: 'image',
        textPosition: payload.textPosition,
        content: payload.text,
      }
    default:
      return null
  }
}

export function buildRmsTplContent(
  mediaContent: RmsFrame[],
  params: LegacyParam[],
): { content: RmsTplFrame[]; params?: RmsParam[] } {
  const content = (JSON.parse(stripReject(JSON.stringify(mediaContent || []))) as RmsFrame[])
    .map((t) => selectParam(t.type, t))
    .filter((x): x is RmsTplFrame => Boolean(x))
  return {
    content,
    params: params.length
      ? params.map((t) => ({
          paramName: `${t.name}`,
          paramType: 'TEXT' as const,
          paramLen: 100,
          paramDesc: `${t.example}`,
          paramRule: '',
        }))
      : undefined,
  }
}
