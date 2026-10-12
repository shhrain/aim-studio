'use client'

import type { LinkCheckResult } from '@aim/api-client'
import { ACTIONS, actionsFor, createActionEvent, type ActionEvent, type ActionFieldDefinition, type ActionType } from '@aim/template-schema'
import { Alert, Badge, Button, Field, Input, RadioOptions, SimpleSelect } from '@aim/ui'
import { CheckCircle2Icon, LinkIcon, PlusIcon, Trash2Icon, XCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { editorApi } from '@/lib/api'
import { TextInput } from './text-input'

const NONE = '__none__'

export interface EventEditorProps {
  value: ActionEvent | undefined
  onChange: (event: ActionEvent | undefined) => void
  elementType: string
  /** 是否允许“无点击事件” */
  optional?: boolean
}

export function EventEditor({ value, onChange, elementType, optional = true }: EventEditorProps) {
  const options = actionsFor(elementType)
  const def = value ? ACTIONS[value.action] : undefined
  const set = (key: string, v: unknown) => value && onChange({ ...value, [key]: v })
  return (
    <div className="space-y-3.5">
      <Field label="事件类型" required={!optional}>
        <SimpleSelect
          value={value?.action ?? NONE}
          onValueChange={(v) => onChange(v === NONE ? undefined : createActionEvent(v as ActionType))}
          options={[...(optional ? [{ value: NONE, label: '无点击事件' }] : []), ...options.map((a) => ({ value: a.type, label: a.label }))]}
        />
      </Field>
      {def && (
        <>
          <p className="-mt-1.5 text-xs leading-relaxed text-muted-foreground">{def.description}</p>
          {def.platformNote && <Alert variant="warning">{def.platformNote}</Alert>}
          {def.fields.map((f) => (
            <ActionField key={f.key} def={f} event={value!} onChange={(v) => set(f.key, v)} />
          ))}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>苹果端（RCS）：</span>
            {def.rcs.kind === 'urlAction' && <Badge variant="success">支持</Badge>}
            {def.rcs.kind === 'dialerAction' && <Badge variant="success">支持（拨号）</Badge>}
            {def.rcs.kind === 'asBrowser' && <Badge variant="info">降级为浏览器打开</Badge>}
            {def.rcs.kind === 'unsupported' && <Badge variant="warning">不支持，提交时需补填链接</Badge>}
          </div>
        </>
      )}
    </div>
  )
}

function ActionField({ def, event, onChange }: { def: ActionFieldDefinition; event: ActionEvent; onChange: (v: unknown) => void }) {
  const raw = event[def.key]
  if (def.visibleWhen && event[def.visibleWhen.key] !== def.visibleWhen.equals) return null
  const value = raw == null ? '' : String(raw)
  let control: React.ReactNode
  switch (def.kind) {
    case 'select':
      control = <SimpleSelect value={value || undefined} onValueChange={onChange} options={def.options ?? []} />
      break
    case 'radio':
      control = <RadioOptions value={value} onValueChange={onChange} options={def.options ?? []} />
      break
    case 'datetime':
      control = <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />
      break
    case 'number':
      control = <Input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
      break
    case 'keyValue':
      control = <KeyValueEditor value={raw} onChange={onChange} />
      break
    case 'url':
      control = <UrlField value={value} onChange={onChange} maxLength={def.maxLength} placeholder={def.placeholder} />
      break
    default:
      control = def.allowParams ? (
        <TextInput value={value} onChange={onChange} maxLength={def.kind === 'textarea' ? def.maxLength : undefined} multiline={def.kind === 'textarea'} placeholder={def.placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} maxLength={def.maxLength} />
      )
  }
  return (
    <Field label={def.label} required={def.required} description={def.help}>
      {control}
    </Field>
  )
}

function UrlField({ value, onChange, maxLength, placeholder }: { value: string; onChange: (v: string) => void; maxLength?: number; placeholder?: string }) {
  const [result, setResult] = useState<LinkCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  return (
    <div className="space-y-1.5">
      <TextInput
        value={value}
        onChange={(v) => {
          setResult(null)
          onChange(v)
        }}
        multiline
        maxLength={maxLength}
        placeholder={placeholder}
      />
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          disabled={!value}
          loading={loading}
          onClick={async () => {
            setLoading(true)
            try {
              setResult(await editorApi.checkLink(value))
            } finally {
              setLoading(false)
            }
          }}
        >
          <LinkIcon />
          检测链接
        </Button>
        {result && (
          <span className={`flex items-center gap-1 text-xs ${result.reachable ? 'text-success' : 'text-destructive'}`}>
            {result.reachable ? <CheckCircle2Icon className="size-3.5" /> : <XCircleIcon className="size-3.5" />}
            {result.message}
          </span>
        )}
      </div>
    </div>
  )
}

function KeyValueEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const list = Array.isArray(value) ? (value as { name: string; value: string }[]) : []
  const update = (next: { name: string; value: string }[]) => onChange(next)
  return (
    <div className="space-y-1.5">
      {list.map((kv, i) => (
        <div key={i} className="flex gap-1.5">
          <Input placeholder="参数名" value={kv.name} onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <Input placeholder="参数值" value={kv.value} onChange={(e) => update(list.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
          <Button size="icon-sm" variant="ghost" aria-label="删除" onClick={() => update(list.filter((_, j) => j !== i))}>
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button size="xs" variant="ghost" onClick={() => update([...list, { name: '', value: '' }])}>
        <PlusIcon />
        添加参数
      </Button>
    </div>
  )
}
