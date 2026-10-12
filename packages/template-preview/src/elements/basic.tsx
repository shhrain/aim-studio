'use client'

import type { TemplateElement } from '@aim/template-schema'
import { formatDuration } from '@aim/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { usePreview } from '../context'
import { toCss, u, useAct, useResolver } from '../hooks'
import { renderTextHtml, renderTextPlain } from '../params'

/** 远程图片懒加载；内联 data URI 无需网络请求，直接加载 */
export const lazy = (src: string | undefined) => (src && !src.startsWith('data:') ? 'lazy' : undefined)

export function TextView({ el }: { el: TemplateElement<'text'> }) {
  const { editor } = usePreview()
  const r = useResolver()
  const act = useAct()
  const ref = useRef<HTMLDivElement>(null)
  const editing = editor?.editingId === el.id
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])
  const css = toCss(el.style)
  if (editing) {
    return (
      <div
        ref={ref}
        className="aim-text"
        style={{ ...css, WebkitLineClamp: undefined, minHeight: '100%' }}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => editor?.onTextCommit?.(el.id, e.currentTarget.innerText.replace(/\n$/, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') (e.target as HTMLElement).blur()
          e.stopPropagation()
        }}
      >
        {el.props.text}
      </div>
    )
  }
  return (
    <div
      className="aim-text"
      data-clamp={el.style?.lineClamp || undefined}
      style={css}
      onClick={(e) => act(el.event, { element: el, e })}
      dangerouslySetInnerHTML={{ __html: renderTextHtml(el.props.text, r) }}
    />
  )
}

export function ImageView({ el }: { el: TemplateElement<'image'> }) {
  const act = useAct()
  const { paramDisplay } = usePreview()
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: u(el.style?.borderRadius), position: 'relative' }}>
      <img
        className="aim-img"
        src={el.props.src || undefined}
        alt={el.props.alt ?? ''}
        loading={lazy(el.props.src)}
        draggable={false}
        style={{ objectFit: el.props.fit ?? 'cover' }}
        onClick={(e) => act(el.event, { element: el, image: el.props.src, e })}
      />
      {el.props.srcParam && paramDisplay === 'token' && <div className="aim-img-param">动态图片 {el.props.srcParam}</div>}
    </div>
  )
}

export function VideoView({ el }: { el: TemplateElement<'video'> }) {
  const { thumbnail, editor, feedback } = usePreview()
  const [playing, setPlaying] = useState(false)
  if (playing && el.props.src) {
    return <video className="aim-video" src={el.props.src} poster={el.props.cover} controls autoPlay playsInline />
  }
  return (
    <div className="aim-media" style={{ borderRadius: u(el.style?.borderRadius) }}>
      {el.props.cover && <img className="aim-media-cover" src={el.props.cover} alt="" loading={lazy(el.props.cover)} draggable={false} />}
      <span
        className="aim-play"
        role="button"
        aria-label="播放视频"
        onClick={(e) => {
          if (thumbnail || editor) return
          e.stopPropagation()
          if (el.props.src) setPlaying(true)
          else feedback.toast('示例视频暂无源文件')
        }}
      />
      {el.props.duration ? <span className="aim-duration">{formatDuration(el.props.duration * 1000)}</span> : null}
    </div>
  )
}

export function AudioView({ el }: { el: TemplateElement<'audio'> }) {
  const { thumbnail, editor, feedback } = usePreview()
  const r = useResolver()
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  useEffect(() => () => audio.current?.pause(), [])
  const toggle = (e: React.MouseEvent) => {
    if (thumbnail || editor) return
    e.stopPropagation()
    if (!el.props.src) return feedback.toast('示例音频暂无源文件')
    if (!audio.current) {
      audio.current = new Audio(el.props.src)
      audio.current.ontimeupdate = () => {
        const a = audio.current!
        setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0)
      }
      audio.current.onended = () => setPlaying(false)
    }
    if (playing) audio.current.pause()
    else void audio.current.play()
    setPlaying(!playing)
  }
  return (
    <div className="aim-audio" style={toCss(el.style)}>
      <button type="button" className="aim-audio-btn" data-playing={playing} aria-label={playing ? '暂停' : '播放'} onClick={toggle} />
      <div className="aim-audio-main">
        <div className="aim-audio-title">{renderTextPlain(el.props.title, r)}</div>
        <div className="aim-audio-bar">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="aim-audio-time">{formatDuration(el.props.duration)}</span>
    </div>
  )
}

export function ButtonView({ el }: { el: TemplateElement<'button'> | TemplateElement<'submitButton'> }) {
  const r = useResolver()
  const act = useAct()
  const variant = el.type === 'button' ? (el.props.variant ?? 'primary') : 'primary'
  const css = toCss(el.style)
  return (
    <div
      className="aim-btn"
      role="button"
      data-variant={variant}
      style={{ ...css, fontSize: css.fontSize ?? u(15) }}
      onClick={(e) => act(el.event, { element: el, label: el.props.text, e })}
    >
      {renderTextPlain(el.props.text, r)}
    </div>
  )
}

export function HotZoneView({ el }: { el: TemplateElement<'hotZone'> }) {
  const act = useAct()
  return (
    <div className="aim-hotzone" onClick={(e) => act(el.event, { element: el, label: el.props.label, e })}>
      {el.props.label}
    </div>
  )
}

export function ShapeView({ el }: { el: TemplateElement<'shape'> }) {
  const css = toCss(el.style)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: css.background ?? '#E5E8EF',
        borderRadius: el.props.shape === 'circle' ? '50%' : css.borderRadius,
        border: css.border,
        opacity: css.opacity,
      }}
    />
  )
}

export function QrCodeView({ el }: { el: TemplateElement<'qrCode'> }) {
  if (el.props.src) return <img className="aim-img" src={el.props.src} alt="二维码" draggable={false} style={{ objectFit: 'contain' }} />
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', padding: u(6) }}>
      <QRCodeSVG value={el.props.content || 'https://'} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
