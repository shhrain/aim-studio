'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import { collectUsedParams, dedupeParams, renameParam } from '@aim/template-core'
import {
  PARAM_NAME_REG,
  PARAM_TYPE_META,
  PARAM_TYPES,
  createParam,
  type ParamType,
  type TemplateParam,
} from '@aim/template-schema'
import { Alert, Badge, Button, Empty, Field, Input, SimpleSelect, toast } from '@aim/ui'
import { BracesIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useEditor } from '../store'

export function ParamsPanel() {
  const ec = useEditorCopy()

  const doc = useEditor((s) => s.doc)
  const update = useEditor((s) => s.update)
  if (!doc) return null
  const used = new Set(collectUsedParams(doc))
  const setParams = (params: TemplateParam[]) =>
    update((d) => ({ ...d, params: dedupeParams(params) }))
  const patch = (i: number, p: Partial<TemplateParam>) =>
    setParams(doc.params.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <div className="space-y-3 p-4">
      <Alert variant="neutral">
        {ec('e2373077eb9')}
        <code className="bg-accent rounded px-1">{ec('e91d343d258')}</code>
        {ec('e1e43abd06f')}
      </Alert>
      {doc.params.length === 0 ? (
        <Empty
          size="sm"
          icon={<BracesIcon className="size-5" />}
          title={ec('e847e2724d3')}
          description={ec('e377a70b286')}
        />
      ) : (
        doc.params.map((p, i) => (
          <ParamCard
            key={`${p.name}-${i}`}
            param={p}
            used={used.has(p.name)}
            onChange={(v) => patch(i, v)}
            onRename={(to) => update((d) => renameParam(d, p.name, to))}
            onRemove={() => setParams(doc.params.filter((_, j) => j !== i))}
          />
        ))
      )}
      <Button
        variant="outline"
        size="sm"
        block
        onClick={() => {
          let n = doc.params.length + 1
          while (doc.params.some((p) => p.name === `param${n}`)) n++
          setParams([...doc.params, createParam(`param${n}`)])
        }}
      >
        <PlusIcon />
        {ec('e4231b08845')}
      </Button>
      <p className="text-muted-foreground text-[11px]">{ec('e4f17ab5bd4')}</p>
    </div>
  )
}

function ParamCard({
  param,
  used,
  onChange,
  onRename,
  onRemove,
}: {
  param: TemplateParam
  used: boolean
  onChange: (p: Partial<TemplateParam>) => void
  onRename: (to: string) => void
  onRemove: () => void
}) {
  const ec = useEditorCopy()

  const [name, setName] = useState(param.name)
  return (
    <div className="bg-card space-y-2.5 rounded-lg border p-3">
      <div className="flex items-center gap-1.5">
        <Input
          className="h-8 font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name === param.name) return
            if (!PARAM_NAME_REG.test(name)) {
              toast.error(ec('e407d6244e2'))
              return setName(param.name)
            }
            onRename(name)
          }}
        />
        {used ? (
          <Badge variant="success">{ec('efa48e89389')}</Badge>
        ) : (
          <Badge variant="secondary">{ec('efa73ed85e8')}</Badge>
        )}
        <Button size="icon-xs" variant="ghost" aria-label={ec('e50a1b81a61')} onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={ec('eba40014ff4')}>
          <SimpleSelect
            size="sm"
            value={param.type}
            onValueChange={(t: ParamType) =>
              onChange({
                type: t,
                example: param.example || PARAM_TYPE_META[t].example,
                maxLength: PARAM_TYPE_META[t].maxLength,
              })
            }
            options={PARAM_TYPES.map((t) => ({ value: t, label: PARAM_TYPE_META[t].label }))}
          />
        </Field>
        <Field label={ec('e0d53f08678')}>
          <Input
            className="h-8"
            value={param.example}
            placeholder={PARAM_TYPE_META[param.type].example}
            onChange={(e) => onChange({ example: e.target.value })}
            aria-invalid={!param.example || undefined}
          />
        </Field>
        <Field label={ec('eba44bcdf0a')}>
          <Input
            className="h-8"
            type="number"
            min={0}
            value={param.minLength}
            onChange={(e) => onChange({ minLength: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label={ec('e8cde38aebc')}>
          <Input
            className="h-8"
            type="number"
            min={1}
            value={param.maxLength}
            onChange={(e) => onChange({ maxLength: Number(e.target.value) || 1 })}
          />
        </Field>
      </div>
    </div>
  )
}
