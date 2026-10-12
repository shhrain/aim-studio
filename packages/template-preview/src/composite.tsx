'use client'

import { convertDocument } from '@aim/template-core'
import {
  PROTOCOL_META,
  VENDORS,
  VENDOR_IDS,
  getLayout,
  type Protocol,
  type TemplateDocument,
  type VendorId,
} from '@aim/template-schema'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { TemplatePreview, type TemplatePreviewProps } from './TemplatePreview'

export interface MultiVendorPreviewProps extends Omit<
  TemplatePreviewProps,
  'vendor' | 'mode' | 'document'
> {
  document: TemplateDocument | null | undefined
  /** 厂商列表，默认模板已选厂商 */
  vendors?: (VendorId | string)[]
  /** 每台手机宽度 */
  phoneWidth?: number
  /** 生成扫码预览链接（可异步）；返回空则不显示二维码 */
  qrcode?: (vendor: VendorId | string) => string | undefined | Promise<string | undefined>
  qrcodeTip?: ReactNode
  renderFooter?: (vendor: VendorId | string) => ReactNode
}

function QrFooter({
  vendor,
  qrcode,
  tip,
}: {
  vendor: string
  qrcode: NonNullable<MultiVendorPreviewProps['qrcode']>
  tip?: ReactNode
}) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let alive = true
    void Promise.resolve(qrcode(vendor)).then((v) => alive && setUrl(v))
    return () => {
      alive = false
    }
  }, [vendor, qrcode])
  if (!url) return <div className="aim-skeleton" style={{ width: 96, height: 96 }} />
  return (
    <div className="aim-multi-footer">
      <QRCodeSVG value={url} size={96} marginSize={1} />
      {tip ?? (
        <>
          <span>打开微信 / 相机，扫码预览</span>
          <small>（二维码 30 分钟内有效）</small>
        </>
      )}
    </div>
  )
}

/** 多厂商并排预览（编辑器“预览”弹窗） */
export function MultiVendorPreview({
  document,
  vendors,
  phoneWidth = 230,
  qrcode,
  qrcodeTip,
  renderFooter,
  ...rest
}: MultiVendorPreviewProps) {
  const list = vendors ?? (document?.vendors.length ? document.vendors : [...VENDOR_IDS])
  return (
    <div
      className="aim-root aim-multi"
      style={{ ['--aim-multi-col' as string]: `${phoneWidth}px` }}
    >
      {list.map((v) => (
        <div key={v} className="aim-multi-item">
          <div className="aim-multi-title">{VENDORS[v as VendorId]?.name ?? v}手机</div>
          <TemplatePreview
            {...rest}
            document={document}
            vendor={v}
            mode="phone"
            width={phoneWidth}
          />
          {renderFooter?.(v) ?? (qrcode && <QrFooter vendor={v} qrcode={qrcode} tip={qrcodeTip} />)}
        </div>
      ))}
    </div>
  )
}

export interface IntegratedPreviewProps extends Omit<
  TemplatePreviewProps,
  'protocol' | 'document'
> {
  document: TemplateDocument | null | undefined
  defaultProtocol?: Protocol
  protocol?: Protocol
  onProtocolChange?: (p: Protocol) => void
  /** 显示转换提示（不支持的按钮、红包截图等） */
  showHints?: boolean
}

/** 三信融合预览：安卓（AIM）/ 苹果（RCS）/ 其他（RMS） Tab 切换 */
export function IntegratedPreview({
  document,
  defaultProtocol = 'aim',
  protocol: controlled,
  onProtocolChange,
  showHints = true,
  ...rest
}: IntegratedPreviewProps) {
  const [inner, setInner] = useState<Protocol>(defaultProtocol)
  const protocol = controlled ?? inner
  const result = useMemo(() => (document ? convertDocument(document) : null), [document])
  const layout = document ? getLayout(document.layoutId) : undefined
  const supported = (p: Protocol) => p === 'aim' || Boolean(result && layout?.protocols.includes(p))
  const hints: string[] = []
  if (result && protocol === 'rcs' && result.editRcsBtns.length)
    hints.push(`${result.editRcsBtns.length} 个按钮事件在苹果端不支持，提交时需补填替代链接`)
  if (result?.needCapture && protocol !== 'aim')
    hints.push('红包将在提交时自动截图生成苹果 / 其他终端审核图')
  if (protocol === 'rms' && result) hints.push(`彩信标题：${result.rmsTitle || '（未设置）'}`)
  return (
    <div className="aim-root aim-integrated">
      <div className="aim-tabs" role="tablist">
        {(['aim', 'rcs', 'rms'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={p === protocol}
            disabled={!supported(p)}
            title={supported(p) ? undefined : '该版式暂不支持'}
            onClick={() => {
              setInner(p)
              onProtocolChange?.(p)
            }}
          >
            {PROTOCOL_META[p].terminal}
          </button>
        ))}
      </div>
      <TemplatePreview {...rest} document={document} protocol={protocol} />
      {showHints &&
        hints.map((h) => (
          <div key={h} className="aim-hint">
            {h}
          </div>
        ))}
    </div>
  )
}
