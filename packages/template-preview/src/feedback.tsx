'use client'

import { Component, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PreviewContextValue } from './context'

type Popup = { title: string; content: string; buttonText: string }

/** 预览内置反馈：toast / 弹窗（OPEN_POPUP）/ 大图（VIEW_IMAGE） */
export function useFeedback() {
  const [toast, setToast] = useState<string | null>(null)
  const [popup, setPopup] = useState<Popup | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showToast = useCallback((message: string) => {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 1800)
  }, [])
  const api: PreviewContextValue['feedback'] = useMemo(
    () => ({
      toast: showToast,
      popup: (title, content, buttonText = '我知道了') => setPopup({ title, content, buttonText }),
      lightbox: (src) => setImage(src),
    }),
    [showToast],
  )
  const layer = (
    <>
      {toast && (
        <div className="aim-toast" role="status">
          {toast}
        </div>
      )}
      {popup && (
        <div className="aim-modal-mask" onClick={() => setPopup(null)}>
          <div
            className="aim-modal"
            role="dialog"
            aria-label={popup.title}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>{popup.title}</h4>
            <p>{popup.content}</p>
            <button type="button" onClick={() => setPopup(null)}>
              {popup.buttonText}
            </button>
          </div>
        </div>
      )}
      {image && (
        <div
          className="aim-lightbox"
          onClick={() => setImage(null)}
          role="dialog"
          aria-label="查看大图"
        >
          <img src={image} alt="" />
        </div>
      )}
    </>
  )
  return { api, layer }
}

export class PreviewErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="aim-notice" role="alert">
            <span className="aim-notice-icon">!</span>
            <span>模板预览失败</span>
            <small style={{ color: 'var(--aim-text-3)' }}>{this.state.error.message}</small>
          </div>
        )
      )
    }
    return this.props.children
  }
}

export function Notice({
  icon = 'i',
  title,
  description,
}: {
  icon?: string
  title: ReactNode
  description?: ReactNode
}) {
  return (
    <div className="aim-notice">
      <span className="aim-notice-icon">{icon}</span>
      <span>{title}</span>
      {description && <small style={{ color: 'var(--aim-text-3)' }}>{description}</small>}
    </div>
  )
}
