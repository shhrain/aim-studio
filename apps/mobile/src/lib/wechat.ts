'use client'

import { api } from './api'

interface Wx {
  config: (c: Record<string, unknown>) => void
  ready: (cb: () => void) => void
  updateAppMessageShareData: (d: Record<string, unknown>) => void
  updateTimelineShareData: (d: Record<string, unknown>) => void
}

export const isWechat = () => typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)

/**
 * 微信分享适配器（可选）：仅在微信内置浏览器中加载 JS-SDK 并配置分享卡片。
 * 签名接口失败时静默降级，不影响页面使用。
 */
export async function setupWechatShare(share: { title: string; desc: string; imgUrl?: string }) {
  if (!isWechat()) return
  try {
    const w = window as unknown as { wx?: Wx }
    if (!w.wx) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('wx sdk load failed'))
        document.head.appendChild(s)
      })
    }
    const sig = await api.wechatSignature(location.href.split('#')[0]!)
    w.wx!.config({ debug: false, ...sig, jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'] })
    w.wx!.ready(() => {
      const data = { ...share, link: location.href }
      w.wx!.updateAppMessageShareData(data)
      w.wx!.updateTimelineShareData(data)
    })
  } catch {
    /* 非关键能力，静默降级 */
  }
}
