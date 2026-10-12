'use client'

import type { ActionEvent, AnyElement, TemplateDocument } from '@aim/template-schema'
import { createContext, useContext, type ReactNode } from 'react'
import type { VendorTheme } from './themes'

/** 参数显示方式：value=传入值优先，否则示例；example=示例值；token=高亮参数名（编辑态） */
export type ParamDisplay = 'value' | 'example' | 'token'

/** 交互模式：intercept=只回调不执行（编辑器/列表）；native=按事件真实执行（真机预览）；none=禁用 */
export type InteractiveMode = 'intercept' | 'native' | 'none'

export interface PreviewActionEvent {
  event: ActionEvent
  element?: AnyElement
  /** 触发来源（按钮文案 / 元素名） */
  label?: string
}

export interface EditorBridge {
  selectedId?: string | null
  issueIds?: ReadonlySet<string>
  onSelect?: (id: string, e: React.MouseEvent) => void
  /** 双击文本进入行内编辑；返回 undefined 不允许编辑 */
  onTextCommit?: (id: string, text: string) => void
  editingId?: string | null
  onEditStart?: (id: string) => void
  /** 渲染元素叠加层（拖拽手柄等） */
  renderOverlay?: (el: AnyElement) => ReactNode
}

export interface PreviewContextValue {
  doc?: TemplateDocument
  theme: VendorTheme
  paramValues: Record<string, string>
  paramDisplay: ParamDisplay
  interactive: InteractiveMode
  onAction?: (e: PreviewActionEvent) => void
  /** 内置反馈：toast / 弹窗 / 大图 */
  feedback: {
    toast: (message: string) => void
    popup: (title: string, content: string, buttonText?: string) => void
    lightbox: (src: string) => void
  }
  editor?: EditorBridge
  /** 是否为缩略图（禁用媒体播放与交互） */
  thumbnail: boolean
}

const Ctx = createContext<PreviewContextValue | null>(null)

export function PreviewProvider({ value, children }: { value: PreviewContextValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePreview(): PreviewContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('预览组件需在 <TemplatePreview> 或 <PreviewProvider> 内使用')
  return v
}
