'use client'

import { convertDocument, fromLegacyPages } from '@aim/template-core'
import { PROTOCOL_META, VENDORS, getLayout, type Protocol, type TemplateDocument, type VendorId } from '@aim/template-schema'
import { formatDate } from '@aim/utils'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { CardCanvas } from './canvas'
import { PreviewProvider, type EditorBridge, type InteractiveMode, type ParamDisplay, type PreviewActionEvent, type PreviewContextValue } from './context'
import { Notice, PreviewErrorBoundary, useFeedback } from './feedback'
import { RcsView, RmsView } from './protocols'
import { PhoneShell } from './shell'
import { getVendorTheme, themeVars } from './themes'

export type PreviewMode = 'phone' | 'bare' | 'fluid' | 'thumbnail'

export interface LegacyTemplateInput {
  pages: string | unknown[]
  cardId?: string
  params?: { name: string; example?: string }[]
}

export interface TemplatePreviewProps {
  /** 模板文档（新协议） */
  document?: TemplateDocument | null
  /** 旧编辑器 pages（自动适配为新协议） */
  legacy?: LegacyTemplateInput
  /** 预览协议：aim（安卓阅信）/ rcs（苹果 5G 消息）/ rms（其他终端彩信） */
  protocol?: Protocol
  /** 厂商皮肤 */
  vendor?: VendorId | string
  /**
   * 展示模式
   * - phone：带手机壳（编辑器、PC 预览）
   * - bare：仅卡片（嵌入列表、对比）
   * - fluid：移动端全宽，带聊天背景与时间（H5 详情页）
   * - thumbnail：缩略图，禁用交互与媒体播放
   */
  mode?: PreviewMode
  /** 宽度：phone 默认 300px，其余默认 100% */
  width?: number | string
  /** 参数值（发送时的真实值） */
  params?: Record<string, string>
  /** 参数显示：value=传入值优先 / example=示例 / token=高亮参数名 */
  paramDisplay?: ParamDisplay
  /** 交互模式：intercept（默认，仅回调）/ native（真实执行）/ none */
  interactive?: InteractiveMode
  onAction?: (e: PreviewActionEvent) => void
  theme?: 'light' | 'dark'
  chatbotName?: string
  chatbotAvatar?: string
  /** 消息时间，默认当前时间 */
  time?: string | number | Date
  showTime?: boolean
  /** 忽略厂商支持矩阵（强制渲染） */
  ignoreVendorSupport?: boolean
  pageIndex?: number
  /** 编辑器桥接：选中、行内编辑、问题标记、叠加层 */
  editor?: EditorBridge
  loading?: boolean
  emptyText?: ReactNode
  className?: string
  style?: CSSProperties
}

function useResolvedDocument(document: TemplateDocument | null | undefined, legacy: LegacyTemplateInput | undefined) {
  return useMemo(() => {
    if (document) return document
    if (legacy?.pages) {
      try {
        return fromLegacyPages(legacy.pages as never, { cardId: legacy.cardId, params: legacy.params })
      } catch {
        return null
      }
    }
    return null
  }, [document, legacy])
}

/**
 * 模板预览（核心组件）。
 * @example <TemplatePreview document={doc} vendor="huawei" mode="phone" />
 */
export function TemplatePreview(props: TemplatePreviewProps) {
  const {
    legacy,
    protocol = 'aim',
    vendor = 'huawei',
    mode = 'phone',
    width,
    params,
    paramDisplay = 'value',
    interactive = 'intercept',
    onAction,
    theme: colorScheme,
    chatbotName,
    chatbotAvatar,
    time,
    showTime = mode !== 'thumbnail' && mode !== 'bare',
    ignoreVendorSupport,
    pageIndex = 0,
    editor,
    loading,
    emptyText = '暂无模板内容',
    className,
    style,
  } = props
  const doc = useResolvedDocument(props.document, legacy)
  const theme = getVendorTheme(vendor)
  const { api, layer } = useFeedback()
  const integrated = useMemo(() => (doc && protocol !== 'aim' ? convertDocument(doc) : null), [doc, protocol])

  const ctx: PreviewContextValue = useMemo(
    () => ({
      doc: doc ?? undefined,
      theme,
      paramValues: params ?? {},
      paramDisplay,
      interactive,
      onAction,
      feedback: api,
      editor,
      thumbnail: mode === 'thumbnail',
    }),
    [doc, theme, params, paramDisplay, interactive, onAction, api, editor, mode],
  )

  const layout = doc ? getLayout(doc.layoutId) : undefined
  const unsupportedVendor = Boolean(doc && layout && !ignoreVendorSupport && protocol === 'aim' && !layout.vendors.includes(vendor as VendorId))
  const timeText = formatDate(time ?? Date.now(), 'YYYY-MM-DD HH:mm')

  let content: ReactNode
  if (loading) content = <div className="aim-skeleton" style={{ height: 260 }} />
  else if (!doc) content = <Notice title={emptyText} />
  else if (unsupportedVendor) {
    content = <Notice icon="⊘" title={`${VENDORS[vendor as VendorId]?.name ?? theme.name}暂不支持此模板`} description={`「${layout?.name}」未在该厂商上架`} />
  } else if (protocol === 'aim') {
    const page = doc.pages[pageIndex] ?? doc.pages[0]!
    content = <CardCanvas page={page} />
  } else if (!integrated) {
    content = <Notice title={`「${layout?.name ?? '该版式'}」暂不支持${PROTOCOL_META[protocol].name}`} description="仅图文、视频、图片轮播、红包、通知类支持三信融合" />
  } else if (protocol === 'rcs') {
    content = <RcsView material={integrated.sourceMaterial} />
  } else {
    content = <RmsView title={integrated.rmsTitle} frames={integrated.mediaContent} />
  }

  const withTime = (
    <>
      {content}
      {showTime && doc && (
        <div className="aim-bubble-time" suppressHydrationWarning>
          {timeText}
        </div>
      )}
    </>
  )

  const rootStyle: CSSProperties = {
    ...themeVars(theme),
    width: width ?? (mode === 'phone' ? 300 : '100%'),
    position: 'relative',
    ...style,
  }

  return (
    <div
      className={`aim-root${mode === 'thumbnail' ? ' aim-thumbnail' : ''} ${className ?? ''}`}
      data-mode={mode}
      data-vendor={theme.id}
      data-protocol={protocol}
      data-theme={colorScheme}
      style={rootStyle}
    >
      <PreviewProvider value={ctx}>
        <PreviewErrorBoundary>
          {mode === 'phone' ? (
            <PhoneShell theme={theme} chatbotName={chatbotName} chatbotAvatar={chatbotAvatar} overlay={layer}>
              {withTime}
            </PhoneShell>
          ) : mode === 'fluid' ? (
            <div style={{ background: 'var(--aim-screen-bg)', padding: 12, position: 'relative' }}>
              {withTime}
              {layer}
            </div>
          ) : (
            <>
              {content}
              {layer}
            </>
          )}
        </PreviewErrorBoundary>
      </PreviewProvider>
    </div>
  )
}

/** 缩略图（列表卡片） */
export function TemplateThumbnail(props: Omit<TemplatePreviewProps, 'mode' | 'interactive'>) {
  return <TemplatePreview {...props} mode="thumbnail" interactive="none" />
}
