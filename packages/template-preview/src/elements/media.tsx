'use client'

import type { AnyElement, LinkButton, TemplateElement } from '@aim/template-schema'
import { useEffect, useRef, useState } from 'react'
import { usePreview } from '../context'
import { u, useAct, useResolver } from '../hooks'
import { renderTextHtml, renderTextPlain } from '../params'
import { lazy } from './basic'

export function SwiperView({ el }: { el: TemplateElement<'swiper'> }) {
  const { thumbnail, editor, feedback } = usePreview()
  const act = useAct()
  const items = el.props.items
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState<number | null>(null)
  const startX = useRef<number | null>(null)
  const count = items.length
  const go = (i: number) => setIndex(el.props.loop ? (i + count) % count : Math.max(0, Math.min(count - 1, i)))

  useEffect(() => {
    if (!el.props.autoplay || thumbnail || editor || count < 2 || playing != null) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), Math.max(1, el.props.interval) * 1000)
    return () => clearInterval(t)
  }, [el.props.autoplay, el.props.interval, thumbnail, editor, count, playing])

  if (!count) return <div className="aim-media" />
  const video = el.props.resourceType === 'video'
  return (
    <div
      className="aim-swiper"
      style={{ borderRadius: u(el.style?.borderRadius) }}
      onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (startX.current == null) return
        const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current
        if (Math.abs(dx) > 30) go(index + (dx < 0 ? 1 : -1))
        startX.current = null
      }}
    >
      <div className="aim-swiper-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {items.map((item, i) => (
          <div key={i} className="aim-swiper-slide">
            {video ? (
              playing === i && item.src ? (
                <video className="aim-video" src={item.src} poster={item.cover} autoPlay controls playsInline />
              ) : (
                <div className="aim-media">
                  {item.cover && <img className="aim-media-cover" src={item.cover} alt="" draggable={false} />}
                  <span
                    className="aim-play"
                    role="button"
                    aria-label="播放视频"
                    onClick={(e) => {
                      if (thumbnail || editor) return
                      e.stopPropagation()
                      if (item.src) setPlaying(i)
                      else feedback.toast('示例视频暂无源文件')
                    }}
                  />
                </div>
              )
            ) : (
              <img
                className="aim-img"
                src={item.src || undefined}
                alt={item.title ?? ''}
                loading={i === 0 ? 'eager' : lazy(item.src)}
                draggable={false}
                onClick={(e) => act(item.event, { element: el, image: item.src, e })}
              />
            )}
          </div>
        ))}
      </div>
      {el.props.indicator && count > 1 && (
        <div className="aim-dots">
          {items.map((_, i) => (
            <i
              key={i}
              data-active={i === index}
              onClick={(e) => {
                e.stopPropagation()
                setIndex(i)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ButtonList({ buttons, element, compact }: { buttons: LinkButton[]; element: AnyElement; compact?: boolean }) {
  const r = useResolver()
  const act = useAct()
  if (!buttons.length) return null
  return (
    <div className="aim-row" style={{ gap: u(10) }}>
      {buttons.map((b, i) => (
        <div
          key={i}
          className="aim-btn"
          role="button"
          data-variant={buttons.length > 1 && i < buttons.length - 1 ? 'secondary' : 'primary'}
          style={{ flex: 1, height: u(compact ? 32 : 38), fontSize: u(compact ? 13 : 14) }}
          onClick={(e) => act(b.event, { element, label: b.text, e })}
        >
          {renderTextPlain(b.text, r)}
        </div>
      ))}
    </div>
  )
}

export function SideslipView({ el }: { el: TemplateElement<'sideslip'> }) {
  const r = useResolver()
  const act = useAct()
  const [w, h] = el.props.ratio
  return (
    <div className="aim-hscroll">
      {el.props.cards.map((card, i) => (
        <div key={i} className="aim-slide-card" onClick={(e) => act(card.event, { element: el, e })}>
          <img
            className="aim-img"
            src={card.src || undefined}
            alt=""
            draggable={false}
            style={{ height: u((210 * h) / w), flexShrink: 0 }}
          />
          <div className="aim-slide-body">
            <div
              className={`aim-t1 ${el.props.showContent ? 'aim-clamp-1' : 'aim-clamp-2'}`}
              style={{ fontSize: u(15) }}
              dangerouslySetInnerHTML={{ __html: renderTextHtml(card.title, r) }}
            />
            {el.props.showContent && (
              <div className="aim-t2 aim-clamp-2" style={{ fontSize: u(12), minHeight: u(36) }} dangerouslySetInnerHTML={{ __html: renderTextHtml(card.content, r) }} />
            )}
            <div style={{ marginTop: 'auto' }}>
              <ButtonList buttons={card.buttons} element={el} compact />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
