import { ACTIONS, type ActionEvent } from '@aim/template-schema'
import { copyText } from '@aim/utils'
import type { PreviewActionEvent, PreviewContextValue } from './context'
import { renderTextPlain, type ParamResolver } from './params'

/** 执行点击事件（native 模式），无法在网页中执行的事件给出提示 */
export function executeAction(event: ActionEvent, ctx: PreviewContextValue, r: ParamResolver, image?: string) {
  const str = (k: string) => renderTextPlain(String(event[k] ?? ''), r)
  const target = str('target')
  const open = (url: string) => {
    if (!url) return ctx.feedback.toast('未配置链接')
    window.open(url, '_blank', 'noopener')
  }
  switch (event.action) {
    case 'OPEN_URL':
    case 'OPEN_BROWSER':
    case 'OPEN_DRAWER':
      return open(target)
    case 'OPEN_QUICK':
      return open(target.replace(/^hap:\/\//, 'https://hapjs.org/'))
    case 'OPEN_APP':
      if (target) window.location.href = target
      return ctx.feedback.toast(`正在打开应用 ${str('packageName')}`)
    case 'DIAL_PHONE':
      window.location.href = `tel:${target}`
      return
    case 'OPEN_SMS':
      window.location.href = `sms:${target}${str('body') ? `?body=${encodeURIComponent(str('body'))}` : ''}`
      return
    case 'OPEN_EMAIL':
      window.location.href = `mailto:${target}?subject=${encodeURIComponent(str('subject'))}&body=${encodeURIComponent(str('body'))}`
      return
    case 'COPY_PARAMETER':
      void copyText(str('content') || target).then((ok) => ctx.feedback.toast(ok ? '已复制' : '复制失败'))
      return
    case 'OPEN_POPUP':
      return ctx.feedback.popup(str('title'), str('content'), str('buttonText') || '我知道了')
    case 'VIEW_IMAGE':
      return image ? ctx.feedback.lightbox(image) : undefined
    case 'OPEN_MAP':
      return open(
        `https://uri.amap.com/marker?position=${event.longitude},${event.latitude}&name=${encodeURIComponent(str('address'))}`,
      )
    case 'OPEN_SCHEDULE':
      return ctx.feedback.toast(`将添加日程「${str('title')}」`)
    default:
      return ctx.feedback.toast(`预览环境暂不支持「${ACTIONS[event.action]?.label ?? event.action}」`)
  }
}

/** 统一的点击分发 */
export function dispatchAction(payload: PreviewActionEvent, ctx: PreviewContextValue, r: ParamResolver, image?: string) {
  if (ctx.interactive === 'none' || ctx.thumbnail) return
  ctx.onAction?.(payload)
  if (ctx.interactive === 'native') executeAction(payload.event, ctx, r, image)
}
