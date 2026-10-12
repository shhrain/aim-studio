import type { ActionEvent, ElementPropsMap, ElementStyle, ElementType, TemplateElement } from '@aim/template-schema'
import { uid } from '@aim/utils'
import { registry } from '../registry'

export interface CreateElementOptions<T extends ElementType> {
  id?: string
  x?: number
  y?: number
  w?: number
  h?: number
  z?: number
  slot?: string
  props?: Partial<ElementPropsMap[T]>
  style?: ElementStyle
  event?: ActionEvent
  locked?: boolean
}

/** 按注册的元素插件创建元素（合并默认 props / style / 尺寸） */
export function createElement<T extends ElementType>(type: T, options: CreateElementOptions<T> = {}): TemplateElement<T> {
  const plugin = registry.element(type)
  const el: TemplateElement<T> = {
    id: options.id ?? uid('el'),
    type,
    x: options.x ?? 0,
    y: options.y ?? 0,
    w: options.w ?? plugin.size.w,
    h: options.h ?? plugin.size.h,
    z: options.z ?? 0,
    angle: 0,
    visible: true,
    locked: options.locked ?? false,
    style: { ...(plugin.style?.() ?? {}), ...(options.style ?? {}) },
    props: { ...plugin.defaults(), ...(options.props ?? {}) } as ElementPropsMap[T],
  }
  if (options.slot) el.slot = options.slot
  if (options.event) el.event = options.event
  else if (['button', 'hotZone'].includes(type)) el.event = { action: 'OPEN_URL', target: '' }
  return el
}
