'use client'

import type { AnyElement, TemplateElement, Voucher } from '@aim/template-schema'
import { useEffect, useState } from 'react'
import { usePreview } from '../context'
import { u, useAct, useResolver } from '../hooks'
import { renderTextHtml, renderTextPlain } from '../params'
import { ECOMMERCE_PALETTE } from '../themes'

function Html({
  text,
  className,
  style,
}: {
  text: string | undefined
  className?: string
  style?: React.CSSProperties
}) {
  const r = useResolver()
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderTextHtml(text, r) }}
    />
  )
}

export function ECommerceView({ el }: { el: TemplateElement<'eCommerce'> }) {
  const { theme, thumbnail, editor } = usePreview()
  const r = useResolver()
  const act = useAct()
  const p = el.props
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (thumbnail || editor || p.media === 'video' || p.images.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % p.images.length), 3000)
    return () => clearInterval(t)
  }, [thumbnail, editor, p.media, p.images.length])
  const palette = ['huawei', 'honor'].includes(theme.id)
  const media =
    p.media === 'video' && p.video ? (
      <div className="aim-media" style={{ height: u(336) }}>
        {p.video.cover && (
          <img className="aim-media-cover" src={p.video.cover} alt="" draggable={false} />
        )}
        <span className="aim-play" />
      </div>
    ) : (
      <div className="aim-swiper" style={{ height: u(342) }}>
        <div className="aim-swiper-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {p.images.map((img, i) => (
            <div key={i} className="aim-swiper-slide">
              <img
                className="aim-img"
                src={img.src || undefined}
                alt=""
                draggable={false}
                onClick={(e) => act(img.event, { element: el, image: img.src, e })}
              />
            </div>
          ))}
        </div>
        {p.images.length > 1 && (
          <div className="aim-dots">
            {p.images.map((_, i) => (
              <i key={i} data-active={i === index} />
            ))}
          </div>
        )}
      </div>
    )
  return (
    <div>
      {media}
      <div className="aim-pad aim-col" style={{ gap: u(6) }}>
        <div className="aim-row" style={{ alignItems: 'baseline', gap: u(6) }}>
          <span className="aim-price" style={{ fontSize: u(14) }}>
            {p.currency}
            <span style={{ fontSize: u(24) }}>{renderTextPlain(p.price, r)}</span>
          </span>
          {p.originalPrice && (
            <s className="aim-t3">{p.currency + renderTextPlain(p.originalPrice, r)}</s>
          )}
          {p.tag && <span className="aim-tag">{renderTextPlain(p.tag, r)}</span>}
        </div>
        <Html text={p.title} className="aim-t1 aim-clamp-1" />
        <Html text={p.description} className="aim-t2 aim-clamp-3" style={{ minHeight: u(50) }} />
        <div className="aim-row" style={{ gap: u(10), marginTop: u(6) }}>
          {p.buttons.map((b, i) => (
            <div
              key={i}
              className="aim-btn"
              role="button"
              style={{
                flex: 1,
                height: u(38),
                ...(palette
                  ? {
                      background: (i === p.buttons.length - 1
                        ? ECOMMERCE_PALETTE.right
                        : ECOMMERCE_PALETTE.left)[p.themeColor],
                      color: '#fff',
                      border: 'none',
                    }
                  : {}),
              }}
              onClick={(e) => act(b.event, { element: el, label: b.text, e })}
            >
              {renderTextPlain(b.text, r)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MoreGoodsView({ el }: { el: TemplateElement<'moreGoods'> }) {
  const r = useResolver()
  const act = useAct()
  const p = el.props
  return (
    <div className="aim-col" style={{ padding: u(12), gap: u(10) }}>
      <div className="aim-row">
        {p.showIcon && (
          <span
            style={{
              width: u(28),
              height: u(28),
              borderRadius: '50%',
              background: 'var(--aim-accent)',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <Html text={p.title} className="aim-t1 aim-clamp-1" style={{ fontSize: u(15) }} />
          <Html text={p.subtitle} className="aim-t3 aim-clamp-1" />
        </div>
      </div>
      {p.items.map((item, i) => (
        <div
          key={i}
          className="aim-row"
          style={{
            background: 'var(--aim-card-bg,#fff)',
            borderRadius: u(10),
            padding: u(8),
            alignItems: 'stretch',
            gap: u(10),
          }}
        >
          <img
            className="aim-img"
            src={item.image || undefined}
            alt=""
            draggable={false}
            style={{ width: u(96), height: u(96), borderRadius: u(8), flexShrink: 0 }}
          />
          <div
            className="aim-col"
            style={{ flex: 1, minWidth: 0, gap: u(4), justifyContent: 'space-between' }}
          >
            <Html
              text={item.name}
              className="aim-clamp-2"
              style={{ fontSize: u(14), fontWeight: 500 }}
            />
            {item.description && <Html text={item.description} className="aim-t3 aim-clamp-1" />}
            <div className="aim-row aim-between">
              <div style={{ minWidth: 0 }}>
                <span className="aim-price" style={{ fontSize: u(16) }}>
                  ¥{renderTextPlain(item.price, r)}
                </span>
                {item.originalPrice && (
                  <s className="aim-t3" style={{ marginLeft: u(4) }}>
                    ¥{renderTextPlain(item.originalPrice, r)}
                  </s>
                )}
              </div>
              <div
                className="aim-btn aim-mini-btn"
                role="button"
                onClick={(e) => act(item.button.event, { element: el, label: item.button.text, e })}
              >
                {renderTextPlain(item.button.text, r)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EcommerceCouponView({ el }: { el: TemplateElement<'ecommerceCoupon'> }) {
  const r = useResolver()
  const act = useAct()
  const p = el.props
  const horizontal = p.direction === 'horizontal'
  return (
    <div className="aim-col" style={{ padding: u(12), gap: u(10) }}>
      <div className="aim-row">
        {p.logo && (
          <img src={p.logo} alt="" style={{ width: u(32), height: u(32), borderRadius: '50%' }} />
        )}
        <div style={{ minWidth: 0 }}>
          <Html text={p.title} className="aim-t1 aim-clamp-1" style={{ fontSize: u(15) }} />
          <Html text={p.subtitle} className="aim-t3 aim-clamp-1" />
        </div>
      </div>
      <div
        className="aim-voucher"
        style={{ background: 'linear-gradient(90deg,#FF6A3D,#E84026)', color: '#fff' }}
      >
        <div
          className="aim-voucher-left"
          style={{ color: '#fff', borderRightColor: 'rgba(255,255,255,.45)' }}
        >
          <div className="aim-voucher-amount">
            <small>¥</small>
            {renderTextPlain(p.coupon.amount, r)}
          </div>
        </div>
        <div className="aim-voucher-right">
          <Html
            text={p.coupon.name}
            className="aim-clamp-1"
            style={{ fontSize: u(15), fontWeight: 600 }}
          />
          <Html
            text={p.coupon.description}
            className="aim-clamp-2"
            style={{ fontSize: u(11), opacity: 0.9 }}
          />
        </div>
        <div
          role="button"
          onClick={(e) => act(p.coupon.event, { element: el, label: '领券', e })}
          style={{
            alignSelf: 'center',
            marginRight: u(12),
            width: u(44),
            height: u(44),
            borderRadius: '50%',
            background: '#FFE7A8',
            color: '#E84026',
            fontWeight: 800,
            fontSize: u(18),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {p.coupon.pickStyle === 'grab' ? '抢' : '领'}
        </div>
      </div>
      <div
        style={
          horizontal
            ? { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: u(8) }
            : { display: 'flex', flexDirection: 'column', gap: u(8) }
        }
      >
        {p.items.map((item, i) =>
          horizontal ? (
            <div
              key={i}
              className="aim-col"
              style={{
                gap: u(4),
                background: 'var(--aim-card-bg,#fff)',
                borderRadius: u(8),
                padding: u(6),
              }}
            >
              <img
                className="aim-img"
                src={item.image || undefined}
                alt=""
                style={{ height: u(90), borderRadius: u(6) }}
              />
              <span className="aim-price" style={{ fontSize: u(14) }}>
                ¥{renderTextPlain(item.price, r)}
              </span>
              <Html text={item.name} className="aim-t2 aim-clamp-1" style={{ fontSize: u(12) }} />
              {item.tag && <span className="aim-tag">{renderTextPlain(item.tag, r)}</span>}
            </div>
          ) : (
            <div
              key={i}
              className="aim-row"
              style={{
                background: 'var(--aim-card-bg,#fff)',
                borderRadius: u(10),
                padding: u(8),
                gap: u(10),
              }}
            >
              <img
                className="aim-img"
                src={item.image || undefined}
                alt=""
                style={{ width: u(80), height: u(80), borderRadius: u(8), flexShrink: 0 }}
              />
              <div className="aim-col" style={{ flex: 1, minWidth: 0, gap: u(6) }}>
                <Html text={item.name} className="aim-clamp-2" style={{ fontSize: u(13) }} />
                <div className="aim-row aim-between">
                  <span className="aim-price" style={{ fontSize: u(16) }}>
                    ¥{renderTextPlain(item.price, r)}
                  </span>
                  {item.button && (
                    <div
                      className="aim-btn aim-mini-btn"
                      role="button"
                      onClick={(e) =>
                        act(item.button?.event, { element: el, label: item.button?.text, e })
                      }
                    >
                      {renderTextPlain(item.button.text, r)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function voucherDate(v: Voucher): string {
  if (v.dateType === 'days') return `领取后 ${v.days ?? 7} 天内有效`
  if (v.dateType === 'custom') return v.customDate ?? ''
  return (v.dateRange ?? []).join('~')
}

function VoucherCard({
  v,
  el,
  showButton,
  dynamic,
}: {
  v: Voucher
  el: AnyElement
  showButton: boolean
  dynamic?: boolean
}) {
  const r = useResolver()
  const act = useAct()
  const unit = v.voucherType === 'discount' ? '折' : ''
  return (
    <div className="aim-voucher">
      <div className="aim-voucher-left">
        <div className="aim-voucher-amount">
          {v.voucherType !== 'discount' && <small>¥</small>}
          {renderTextPlain(v.amount, r)}
          {unit && <small>{unit}</small>}
        </div>
        <div style={{ fontSize: u(11), marginTop: u(2) }}>{renderTextPlain(v.threshold, r)}</div>
      </div>
      <div className="aim-voucher-right">
        <div className="aim-row" style={{ gap: u(6) }}>
          <span className="aim-tag">{renderTextPlain(v.tagName, r)}</span>
        </div>
        <div
          className="aim-clamp-2"
          style={{ fontSize: u(13), fontWeight: 600 }}
          dangerouslySetInnerHTML={{ __html: renderTextHtml(v.name, r) }}
        />
        <div className="aim-t3" style={{ fontSize: u(11) }}>
          {voucherDate(v)}
        </div>
      </div>
      {showButton && v.button && (
        <div style={{ alignSelf: 'center', paddingRight: u(10) }}>
          <div
            className="aim-btn aim-mini-btn aim-voucher-btn"
            data-dynamic={dynamic || undefined}
            role="button"
            onClick={(e) => act(v.button?.event, { element: el, label: v.button?.text, e })}
          >
            {renderTextPlain(v.button.text, r)}
          </div>
        </div>
      )}
    </div>
  )
}

export function CardVoucherView({ el }: { el: TemplateElement<'cardVoucher'> }) {
  return (
    <div
      className="aim-col"
      style={{ padding: u(12), background: 'var(--aim-card-bg,#fff)', borderRadius: u(14) }}
    >
      {el.props.image && (
        <img
          className="aim-img"
          src={el.props.image}
          alt=""
          style={{ height: u(100), borderRadius: u(8) }}
        />
      )}
      <VoucherCard v={el.props} el={el} showButton dynamic={el.props.dynamicButton} />
    </div>
  )
}

export function CardVouchersView({ el }: { el: TemplateElement<'cardVouchers'> }) {
  const r = useResolver()
  const act = useAct()
  const p = el.props
  return (
    <div className="aim-col" style={{ padding: u(12), gap: u(10) }}>
      <div
        className="aim-t1 aim-clamp-1"
        dangerouslySetInnerHTML={{ __html: renderTextHtml(p.title, r) }}
      />
      {p.items.map((v, i) => (
        <VoucherCard key={i} v={v} el={el} showButton={p.buttonMode === 'each'} />
      ))}
      {p.buttonMode === 'bottom' && p.button && (
        <div
          className="aim-btn aim-voucher-btn"
          role="button"
          style={{ height: u(40) }}
          onClick={(e) => act(p.button?.event, { element: el, label: p.button?.text, e })}
        >
          {renderTextPlain(p.button.text, r)}
        </div>
      )}
    </div>
  )
}

export function CountdownView({ el }: { el: TemplateElement<'countdown'> }) {
  const { thumbnail } = usePreview()
  const act = useAct()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (thumbnail) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [thumbnail])
  const left = Math.max(0, el.props.endTime - now)
  const s = Math.floor(left / 1000)
  const parts = [
    Math.floor(s / 86400),
    Math.floor((s % 86400) / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ]
  const box = {
    minWidth: u(26),
    height: u(26),
    padding: `0 ${u(4)}`,
    borderRadius: u(4),
    background: '#1F2329',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  } as const
  return (
    <div
      className="aim-row"
      style={{ height: '100%', justifyContent: 'center', gap: u(5), fontSize: u(13) }}
      onClick={(e) => act(el.event, { element: el, e })}
    >
      <span className="aim-t2">{el.props.label}</span>
      {parts.map((n, i) => (
        <span key={i} className="aim-row" style={{ gap: u(4) }}>
          <span style={box}>{String(n).padStart(2, '0')}</span>
          <span>{['天', '时', '分', '秒'][i]}</span>
        </span>
      ))}
    </div>
  )
}
