'use client'

import type { AnyElement, ElementType, TemplateElement } from '@aim/template-schema'
import type { ComponentType } from 'react'
import { AudioView, ButtonView, HotZoneView, ImageView, QrCodeView, ShapeView, TextView, VideoView } from './basic'
import { ChoiceView, FormView, ImgSelectView, InputView, PickerView, TextSelectView } from './form'
import { CardVoucherView, CardVouchersView, CountdownView, ECommerceView, EcommerceCouponView, MoreGoodsView } from './marketing'
import { SideslipView, SwiperView } from './media'
import { AgreementView, MapView, ServiceNumberView, TelView, TicketView } from './service'

export type ElementRenderer<T extends ElementType = ElementType> = ComponentType<{ el: TemplateElement<T> }>

export interface PreviewElementDefinition<T extends ElementType = ElementType> {
  type: T
  Render: ElementRenderer<T>
  /** flow 模式下高度是否随内容自适应（复合元素 / 文本） */
  autoHeight?: boolean
}

const renderers = new Map<ElementType, PreviewElementDefinition<ElementType>>()

/** 注册 / 覆盖元素渲染器（自定义元素或替换内置样式） */
export function definePreviewElement<T extends ElementType>(def: PreviewElementDefinition<T>) {
  renderers.set(def.type, def as unknown as PreviewElementDefinition<ElementType>)
  return def
}

export function getPreviewElement(type: ElementType): PreviewElementDefinition<ElementType> | undefined {
  return renderers.get(type)
}

const auto = true
definePreviewElement({ type: 'text', Render: TextView, autoHeight: auto })
definePreviewElement({ type: 'image', Render: ImageView })
definePreviewElement({ type: 'video', Render: VideoView })
definePreviewElement({ type: 'audio', Render: AudioView })
definePreviewElement({ type: 'button', Render: ButtonView })
definePreviewElement({ type: 'submitButton', Render: ButtonView })
definePreviewElement({ type: 'hotZone', Render: HotZoneView })
definePreviewElement({ type: 'shape', Render: ShapeView })
definePreviewElement({ type: 'qrCode', Render: QrCodeView })
definePreviewElement({ type: 'swiper', Render: SwiperView })
definePreviewElement({ type: 'sideslip', Render: SideslipView, autoHeight: auto })
definePreviewElement({ type: 'eCommerce', Render: ECommerceView, autoHeight: auto })
definePreviewElement({ type: 'moreGoods', Render: MoreGoodsView, autoHeight: auto })
definePreviewElement({ type: 'ecommerceCoupon', Render: EcommerceCouponView, autoHeight: auto })
definePreviewElement({ type: 'cardVoucher', Render: CardVoucherView, autoHeight: auto })
definePreviewElement({ type: 'cardVouchers', Render: CardVouchersView, autoHeight: auto })
definePreviewElement({ type: 'countdown', Render: CountdownView })
definePreviewElement({ type: 'ticketImage', Render: TicketView, autoHeight: auto })
definePreviewElement({ type: 'tel', Render: TelView })
definePreviewElement({ type: 'map', Render: MapView })
definePreviewElement({ type: 'serviceNumber', Render: ServiceNumberView })
definePreviewElement({ type: 'agreement', Render: AgreementView, autoHeight: auto })
definePreviewElement({ type: 'form', Render: FormView, autoHeight: auto })
definePreviewElement({ type: 'input', Render: InputView, autoHeight: auto })
definePreviewElement({ type: 'textarea', Render: InputView, autoHeight: auto })
definePreviewElement({ type: 'radioGroup', Render: ChoiceView, autoHeight: auto })
definePreviewElement({ type: 'checkboxGroup', Render: ChoiceView, autoHeight: auto })
definePreviewElement({ type: 'picker', Render: PickerView, autoHeight: auto })
definePreviewElement({ type: 'datePicker', Render: PickerView, autoHeight: auto })
definePreviewElement({ type: 'timePicker', Render: PickerView, autoHeight: auto })
definePreviewElement({ type: 'textSelect', Render: TextSelectView, autoHeight: auto })
definePreviewElement({ type: 'imgSelect', Render: ImgSelectView, autoHeight: auto })

/** 渲染单个元素内容（不含定位外壳） */
export function ElementContent({ el }: { el: AnyElement }) {
  const def = renderers.get(el.type)
  if (!def) return <div className="aim-t3">不支持的元素：{el.type}</div>
  const Render = def.Render as ElementRenderer
  return <Render el={el as TemplateElement} />
}
