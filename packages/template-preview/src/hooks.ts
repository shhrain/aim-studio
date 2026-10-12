'use client'

import type { ActionEvent, AnyElement, ElementStyle } from '@aim/template-schema'
import { useMemo, type CSSProperties } from 'react'
import { dispatchAction } from './actions'
import { usePreview } from './context'
import type { ParamResolver } from './params'

/** 画布单位：u(14) → calc(var(--u) * 14) */
export const u = (n: number | undefined) =>
  n == null ? undefined : `calc(var(--u) * ${Math.round(n * 100) / 100})`

export function useResolver(): ParamResolver {
  const { doc, paramDisplay, paramValues } = usePreview()
  return useMemo(
    () => ({
      display: paramDisplay,
      values: paramValues,
      examples: Object.fromEntries((doc?.params ?? []).map((p) => [p.name, p.example])),
    }),
    [doc?.params, paramDisplay, paramValues],
  )
}

/** 点击事件：编辑态只选中，不触发事件 */
export function useAct() {
  const ctx = usePreview()
  const resolver = useResolver()
  return (
    event: ActionEvent | undefined,
    opts: { element?: AnyElement; label?: string; image?: string; e?: React.MouseEvent } = {},
  ) => {
    if (!event || ctx.editor) return
    opts.e?.stopPropagation()
    dispatchAction({ event, element: opts.element, label: opts.label }, ctx, resolver, opts.image)
  }
}

/** ElementStyle → CSS（数值转画布单位） */
export function toCss(style: ElementStyle | undefined): CSSProperties {
  if (!style) return {}
  const css: CSSProperties = {}
  if (style.color) css.color = style.color
  if (style.backgroundColor) css.background = style.backgroundColor
  if (style.fontSize) css.fontSize = u(style.fontSize)
  if (style.fontWeight) css.fontWeight = style.fontWeight as CSSProperties['fontWeight']
  if (style.lineHeight) css.lineHeight = style.lineHeight
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.letterSpacing) css.letterSpacing = u(style.letterSpacing)
  if (style.borderRadius != null) css.borderRadius = u(style.borderRadius)
  if (style.padding) css.padding = u(style.padding)
  if (style.opacity != null) css.opacity = style.opacity
  if (style.borderWidth && style.borderStyle && style.borderStyle !== 'none') {
    css.border = `${u(style.borderWidth)} ${style.borderStyle} ${style.borderColor ?? '#E5E8EF'}`
  }
  if (style.lineClamp) {
    css.WebkitLineClamp = style.lineClamp
  }
  return css
}
