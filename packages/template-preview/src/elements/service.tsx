'use client'

import type { TemplateElement } from '@aim/template-schema'
import { toCss, u, useAct, useResolver } from '../hooks'
import { renderTextHtml, renderTextPlain } from '../params'

const KIND_LABEL = { train: '火车', bus: '汽车', flight: '航班', direct: '直飞' } as const

export function TicketView({ el }: { el: TemplateElement<'ticketImage'> }) {
  const r = useResolver()
  const p = el.props
  const t = (s: string | undefined) => renderTextPlain(s, r)
  return (
    <div className="aim-ticket">
      <div className="aim-row aim-between" style={{ marginBottom: u(10) }}>
        <span className="aim-tag" style={{ color: 'var(--aim-accent)', background: 'color-mix(in srgb, var(--aim-accent) 10%, transparent)' }}>
          {KIND_LABEL[p.kind]} · {t(p.number)}
        </span>
        <span className="aim-t3">{t(p.from.date)}</span>
      </div>
      <div className="aim-ticket-route">
        <div>
          <div className="aim-ticket-time">{t(p.from.time)}</div>
          <div className="aim-t2 aim-clamp-1">{t(p.from.name)}</div>
        </div>
        <div className="aim-ticket-arrow">{t(p.duration)}</div>
        <div style={{ textAlign: 'right' }}>
          <div className="aim-ticket-time">{t(p.to.time)}</div>
          <div className="aim-t2 aim-clamp-1">{t(p.to.name)}</div>
        </div>
      </div>
      <div className="aim-ticket-grid">
        {p.grid.map((g, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            <div className="aim-t3">{t(g.label)}</div>
            <div className="aim-clamp-1" style={{ fontSize: u(14), fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: renderTextHtml(g.value, r) }} />
          </div>
        ))}
      </div>
      {p.extra?.map((g, i) => (
        <div key={i} className="aim-row aim-between" style={{ marginTop: u(8), fontSize: u(12) }}>
          <span className="aim-t3">{t(g.label)}</span>
          <span dangerouslySetInnerHTML={{ __html: renderTextHtml(g.value, r) }} />
        </div>
      ))}
      {p.tip && (
        <div className="aim-t3" style={{ marginTop: u(10), maxHeight: u(63), overflowY: 'auto' }}>
          {t(p.tip)}
        </div>
      )}
    </div>
  )
}

export function TelView({ el }: { el: TemplateElement<'tel'> }) {
  const r = useResolver()
  const act = useAct()
  const event = el.event ?? { action: 'DIAL_PHONE' as const, target: el.props.phone }
  const onClick = (e: React.MouseEvent) => act(event, { element: el, label: el.props.text, e })
  if (el.props.styleType === 'pic' && el.props.image)
    return <img className="aim-img" src={el.props.image} alt={el.props.text} onClick={onClick} draggable={false} />
  if (el.props.styleType === 'icon')
    return (
      <div role="button" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--aim-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(18) }}>
        ☎
      </div>
    )
  return (
    <div role="button" className="aim-row" onClick={onClick} style={{ height: '100%', justifyContent: 'center', gap: u(6), color: 'var(--aim-accent)', fontSize: u(15), ...toCss(el.style) }}>
      <span>☎</span>
      <span>{renderTextPlain(el.props.text, r)}</span>
      <span style={{ fontWeight: 600 }}>{renderTextPlain(el.props.phone, r)}</span>
    </div>
  )
}

export function MapView({ el }: { el: TemplateElement<'map'> }) {
  const r = useResolver()
  const act = useAct()
  const event = el.event ?? { action: 'OPEN_MAP' as const, address: el.props.title, longitude: el.props.longitude, latitude: el.props.latitude }
  const onClick = (e: React.MouseEvent) => act(event, { element: el, label: el.props.title, e })
  if (el.props.mode === 'text')
    return (
      <div role="button" className="aim-row" onClick={onClick} style={{ height: '100%', fontSize: u(13) }}>
        <span style={{ color: '#F54A45' }}>📍</span>
        <span className="aim-clamp-1">{renderTextPlain(el.props.title, r)}</span>
      </div>
    )
  return (
    <div role="button" className="aim-map" onClick={onClick}>
      <span className="aim-map-pin" />
      <div className="aim-map-info">
        <div className="aim-clamp-1" style={{ fontSize: u(14), fontWeight: 600 }}>
          {renderTextPlain(el.props.title, r)}
        </div>
        <div className="aim-t3 aim-clamp-1">{renderTextPlain(el.props.address, r)}</div>
      </div>
    </div>
  )
}

export function ServiceNumberView({ el }: { el: TemplateElement<'serviceNumber'> }) {
  const r = useResolver()
  const act = useAct()
  const onClick = (e: React.MouseEvent) => act(el.event, { element: el, label: el.props.name, e })
  if (el.props.mode === 'guide')
    return (
      <div role="button" className="aim-row aim-between" onClick={onClick} style={{ height: '100%', fontSize: u(13), color: 'var(--aim-text-2)' }}>
        <span>打开「{renderTextPlain(el.props.name, r)}」了解更多</span>
        <span>›</span>
      </div>
    )
  return (
    <div className="aim-row" style={{ height: '100%' }}>
      <img src={el.props.avatar} alt="" style={{ width: u(40), height: u(40), borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="aim-clamp-1" style={{ fontSize: u(14), fontWeight: 600 }}>
          {renderTextPlain(el.props.name, r)}
        </div>
        {el.props.description && <div className="aim-t3 aim-clamp-1">{renderTextPlain(el.props.description, r)}</div>}
      </div>
      <div className="aim-btn aim-mini-btn" role="button" data-variant="secondary" onClick={onClick}>
        主页
      </div>
    </div>
  )
}

export function AgreementView({ el }: { el: TemplateElement<'agreement'> }) {
  const r = useResolver()
  const act = useAct()
  return (
    <div className="aim-option" style={{ height: '100%', fontSize: u(12), color: 'var(--aim-text-2)', flexWrap: 'wrap' }}>
      <i style={{ borderRadius: u(3) }} />
      <span>{renderTextPlain(el.props.text, r)}</span>
      {el.props.links.map((l, i) => (
        <span
          key={i}
          role="link"
          style={{ color: 'var(--aim-accent)', cursor: 'pointer' }}
          onClick={(e) => act(l.url ? { action: 'OPEN_URL', target: l.url } : undefined, { element: el, label: l.text, e })}
        >
          {renderTextPlain(l.text, r)}
        </span>
      ))}
    </div>
  )
}
