'use client'

import type { TemplateElement } from '@aim/template-schema'
import { useState } from 'react'
import { u, useAct, useResolver } from '../hooks'
import { renderTextPlain } from '../params'

function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="aim-field">
      {label && <span className="aim-field-label">{label}</span>}
      {children}
    </div>
  )
}

function Control({
  placeholder,
  arrow,
  styleType,
}: {
  placeholder: string
  arrow?: string
  styleType?: string
}) {
  return (
    <div className="aim-field-control" data-style={styleType}>
      <span>{placeholder}</span>
      {arrow && <span>{arrow}</span>}
    </div>
  )
}

export function FormView({ el }: { el: TemplateElement<'form'> }) {
  const r = useResolver()
  const [agree, setAgree] = useState(false)
  return (
    <div className="aim-col" style={{ padding: `0 ${u(14)} ${u(14)}`, gap: u(12) }}>
      {el.props.fields.map((f, i) => (
        <Field key={i} label={`${f.required ? '* ' : ''}${renderTextPlain(f.label, r)}`}>
          <Control
            placeholder={renderTextPlain(f.placeholder, r)}
            arrow={f.type === 'select' ? '▾' : f.type === 'date' ? '📅' : undefined}
          />
        </Field>
      ))}
      <div
        className="aim-option"
        data-type="checkbox"
        data-active={agree}
        onClick={() => setAgree(!agree)}
        style={{ cursor: 'pointer', fontSize: u(12) }}
      >
        <i />
        <span className="aim-t2" style={{ fontSize: u(12) }}>
          {el.props.privacyText}
        </span>
      </div>
      <div className="aim-btn" role="button" style={{ height: u(40) }}>
        {renderTextPlain(el.props.submitText, r)}
      </div>
    </div>
  )
}

export function InputView({ el }: { el: TemplateElement<'input'> | TemplateElement<'textarea'> }) {
  const r = useResolver()
  return (
    <Field label={renderTextPlain(el.props.label, r)}>
      <div
        className="aim-field-control"
        data-style={el.props.inputStyle}
        style={
          el.type === 'textarea'
            ? { height: u(72), alignItems: 'flex-start', paddingTop: u(8) }
            : undefined
        }
      >
        <span>{renderTextPlain(el.props.placeholder, r)}</span>
      </div>
    </Field>
  )
}

export function ChoiceView({
  el,
}: {
  el: TemplateElement<'radioGroup'> | TemplateElement<'checkboxGroup'>
}) {
  const r = useResolver()
  const [active, setActive] = useState<number[]>([])
  const multiple = el.type === 'checkboxGroup'
  return (
    <Field label={renderTextPlain(el.props.label, r)}>
      <div className="aim-row" style={{ flexWrap: 'wrap', gap: `${u(8)} ${u(16)}` }}>
        {el.props.options.map((o, i) => (
          <span
            key={i}
            className="aim-option"
            data-type={multiple ? 'checkbox' : 'radio'}
            data-active={active.includes(i)}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              setActive(
                multiple
                  ? active.includes(i)
                    ? active.filter((x) => x !== i)
                    : [...active, i]
                  : [i],
              )
            }
          >
            <i />
            {renderTextPlain(o, r)}
          </span>
        ))}
      </div>
    </Field>
  )
}

export function PickerView({
  el,
}: {
  el: TemplateElement<'picker'> | TemplateElement<'datePicker'> | TemplateElement<'timePicker'>
}) {
  const r = useResolver()
  const arrow = el.type === 'picker' ? '▾' : el.type === 'datePicker' ? '📅' : '🕒'
  return (
    <Field label={renderTextPlain(el.props.label, r)}>
      <Control placeholder={renderTextPlain(el.props.placeholder, r)} arrow={arrow} />
    </Field>
  )
}

export function TextSelectView({ el }: { el: TemplateElement<'textSelect'> }) {
  const r = useResolver()
  const act = useAct()
  const [active, setActive] = useState(el.props.activeIndex)
  return (
    <div className="aim-col" style={{ gap: u(8) }}>
      {el.props.options.map((o, i) => (
        <div
          key={i}
          className="aim-select-item"
          role="radio"
          aria-checked={active === i}
          data-active={active === i}
          onClick={(e) => {
            setActive(i)
            act(o.event, { element: el, label: o.title, e })
          }}
        >
          {renderTextPlain(o.title, r)}
        </div>
      ))}
    </div>
  )
}

export function ImgSelectView({ el }: { el: TemplateElement<'imgSelect'> }) {
  const r = useResolver()
  const act = useAct()
  const [active, setActive] = useState(el.props.activeIndex)
  return (
    <div className="aim-hscroll">
      {el.props.options.map((o, i) => (
        <div
          key={i}
          role="radio"
          aria-checked={active === i}
          onClick={(e) => {
            setActive(i)
            act(o.event, { element: el, label: o.title, e })
          }}
          style={{
            flex: `0 0 ${u(123)}`,
            borderRadius: u(10),
            overflow: 'hidden',
            border: `${u(2)} solid ${active === i ? 'var(--aim-accent)' : 'transparent'}`,
            background: 'var(--aim-card-bg,#fff)',
            cursor: 'pointer',
          }}
        >
          <img
            className="aim-img"
            src={o.src || undefined}
            alt=""
            draggable={false}
            style={{ height: u(119) }}
          />
          {el.props.showTitle && (
            <div
              className="aim-clamp-1"
              style={{ padding: `${u(6)} ${u(8)}`, fontSize: u(13), textAlign: 'center' }}
            >
              {renderTextPlain(o.title, r)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
