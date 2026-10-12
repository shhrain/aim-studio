export interface DragScrollOptions {
  /** 鼠标滚轮纵向滚动转为横向（滚到边缘后交还给页面），默认 true */
  wheel?: boolean
  /** 鼠标按下拖拽滚动，默认 true（触摸设备使用原生滑动） */
  drag?: boolean
  /** 超过该位移（px）视为拖拽并拦截随后的 click，默认 5 */
  threshold?: number
}

/**
 * 为横向滚动容器补齐桌面端交互：鼠标拖拽、滚轮横滑、拖拽后不误触点击。
 * 拖拽过程中临时关闭 scroll-snap，松手后恢复并吸附到最近一项。
 * 返回清理函数。仅在浏览器环境调用。
 *
 * @example
 * useEffect(() => enableDragScroll(ref.current!), [])
 */
export function enableDragScroll(el: HTMLElement, options: DragScrollOptions = {}): () => void {
  const { wheel = true, drag = true, threshold = 5 } = options
  const overflow = () => el.scrollWidth - el.clientWidth > 1

  /** 开启 scroll-snap 时滚轮按“项”翻动，否则小步滚动会被吸附回原位 */
  const snapTarget = (dir: number) => {
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
    const base = el.getBoundingClientRect().left - el.scrollLeft + pad
    const offsets = Array.from(el.children, (c) => c.getBoundingClientRect().left - base)
    const cur = el.scrollLeft
    const next =
      dir > 0 ? offsets.find((o) => o > cur + 2) : [...offsets].reverse().find((o) => o < cur - 2)
    const max = el.scrollWidth - el.clientWidth
    return Math.min(max, Math.max(0, next ?? (dir > 0 ? max : 0)))
  }
  let wheelLock = 0

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || !overflow()) return
    // 触控板横向手势、Shift+滚轮浏览器已原生处理
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.shiftKey) return
    const max = el.scrollWidth - el.clientWidth
    const atStart = el.scrollLeft <= 0 && e.deltaY < 0
    const atEnd = el.scrollLeft >= max - 1 && e.deltaY > 0
    if (atStart || atEnd) return
    e.preventDefault()
    if (getComputedStyle(el).scrollSnapType.startsWith('none')) {
      el.scrollBy({ left: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY })
      return
    }
    if (Date.now() < wheelLock) return
    wheelLock = Date.now() + 320
    el.scrollTo({ left: snapTarget(Math.sign(e.deltaY)), behavior: 'smooth' })
  }

  let startX = 0
  let startLeft = 0
  let pointerId: number | null = null
  let dragging = false
  let snap = ''

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !overflow()) return
    pointerId = e.pointerId
    startX = e.clientX
    startLeft = el.scrollLeft
    dragging = false
  }
  const onPointerMove = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return
    const dx = e.clientX - startX
    if (!dragging) {
      if (Math.abs(dx) < threshold) return
      dragging = true
      snap = el.style.scrollSnapType
      el.style.scrollSnapType = 'none'
      el.dataset.dragging = 'true'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // 元素已卸载或指针已释放
      }
    }
    el.scrollLeft = startLeft - dx
  }
  const onPointerUp = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return
    pointerId = null
    if (!dragging) return
    el.style.scrollSnapType = snap
    delete el.dataset.dragging
    // 拖拽结束后的 click 不应触发卡片点击 / 元素选中
    const swallow = (ev: MouseEvent) => {
      ev.stopPropagation()
      ev.preventDefault()
    }
    el.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0)
    dragging = false
  }

  if (wheel) el.addEventListener('wheel', onWheel, { passive: false })
  if (drag) {
    el.dataset.dragScroll = 'true'
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
  }
  return () => {
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    delete el.dataset.dragScroll
    delete el.dataset.dragging
  }
}
