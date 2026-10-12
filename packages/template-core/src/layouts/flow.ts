import {
  CANVAS_WIDTH,
  type AnyElement,
  type ElementType,
  type TemplateElement,
} from '@aim/template-schema'
import { createElement, type CreateElementOptions } from '../elements/factory'

export const PAD = 14
export const INNER = CANVAS_WIDTH - PAD * 2

/** 文本块高度：按字符数估算行数（中文字宽≈字号） */
export function textHeight(maxChars: number, fontSize: number, width = INNER, lineHeight = 1.5) {
  const perLine = Math.max(1, Math.floor(width / fontSize))
  const lines = Math.max(1, Math.ceil(maxChars / perLine))
  return Math.ceil(lines * fontSize * lineHeight)
}

/**
 * 纵向流式构建器：按顺序追加元素并自动计算 y。
 * 结构化版式渲染为 flow 模式时，y 只用于排序与间距；切换为自由版式时坐标即为绝对位置。
 */
export class FlowBuilder {
  y = 0
  readonly elements: AnyElement[] = []
  private z = 0

  gap(h: number) {
    this.y += h
    return this
  }

  add<T extends ElementType>(
    type: T,
    options: CreateElementOptions<T> & { gapAfter?: number } = {},
  ): TemplateElement<T> {
    const el = createElement(type, { x: 0, ...options, y: options.y ?? this.y, z: this.z++ })
    this.elements.push(el as AnyElement)
    this.y = el.y + el.h + (options.gapAfter ?? 0)
    return el
  }

  /** 同一行并排（y 相同）：按 widths 比例分配，gap 为列间距 */
  row<T extends ElementType>(
    type: T,
    items: CreateElementOptions<T>[],
    options: { h: number; gap?: number; x?: number; width?: number; gapAfter?: number },
  ) {
    const gap = options.gap ?? 10
    const x0 = options.x ?? PAD
    const width = options.width ?? INNER
    const w = (width - gap * (items.length - 1)) / items.length
    const y = this.y
    items.forEach((item, i) => {
      const el = createElement(type, {
        ...item,
        x: x0 + i * (w + gap),
        y,
        w,
        h: options.h,
        z: this.z++,
      })
      this.elements.push(el as AnyElement)
    })
    this.y = y + options.h + (options.gapAfter ?? 0)
    return this
  }

  get height() {
    return Math.ceil(this.y)
  }
}
