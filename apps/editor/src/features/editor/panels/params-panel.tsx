'use client'

import { collectUsedParams, dedupeParams, renameParam } from '@aim/template-core'
import { PARAM_NAME_REG, PARAM_TYPE_META, PARAM_TYPES, createParam, type ParamType, type TemplateParam } from '@aim/template-schema'
import { Alert, Badge, Button, Empty, Field, Input, SimpleSelect, toast } from '@aim/ui'
import { BracesIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useEditor } from '../store'

export function ParamsPanel() {
  const doc = useEditor((s) => s.doc)
  const update = useEditor((s) => s.update)
  if (!doc) return null
  const used = new Set(collectUsedParams(doc))
  const setParams = (params: TemplateParam[]) => update((d) => ({ ...d, params: dedupeParams(params) }))
  const patch = (i: number, p: Partial<TemplateParam>) => setParams(doc.params.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <div className="space-y-3 p-4">
      <Alert variant="neutral">
        在文本或链接中插入 <code className="rounded bg-accent px-1">{'{#参数名#}'}</code>，发送时替换为实际值。审核按“参数示例”计算字数，请填写真实格式的示例。
      </Alert>
      {doc.params.length === 0 ? (
        <Empty size="sm" icon={<BracesIcon className="size-5" />} title="暂无参数" description="在文本输入框下方点击「插入参数」即可自动创建" />
      ) : (
        doc.params.map((p, i) => <ParamCard key={`${p.name}-${i}`} param={p} used={used.has(p.name)} onChange={(v) => patch(i, v)} onRename={(to) => update((d) => renameParam(d, p.name, to))} onRemove={() => setParams(doc.params.filter((_, j) => j !== i))} />)
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
        新增参数
      </Button>
      <p className="text-[11px] text-muted-foreground">同名参数会自动合并到第一个定义。</p>
    </div>
  )
}

function ParamCard({ param, used, onChange, onRename, onRemove }: { param: TemplateParam; used: boolean; onChange: (p: Partial<TemplateParam>) => void; onRename: (to: string) => void; onRemove: () => void }) {
  const [name, setName] = useState(param.name)
  return (
    <div className="space-y-2.5 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Input
          className="h-8 font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name === param.name) return
            if (!PARAM_NAME_REG.test(name)) {
              toast.error('参数名仅支持中英文、数字、下划线')
              return setName(param.name)
            }
            onRename(name)
          }}
        />
        {used ? <Badge variant="success">使用中</Badge> : <Badge variant="secondary">未使用</Badge>}
        <Button size="icon-xs" variant="ghost" aria-label="删除参数" onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="类型">
          <SimpleSelect
            size="sm"
            value={param.type}
            onValueChange={(t: ParamType) => onChange({ type: t, example: param.example || PARAM_TYPE_META[t].example, maxLength: PARAM_TYPE_META[t].maxLength })}
            options={PARAM_TYPES.map((t) => ({ value: t, label: PARAM_TYPE_META[t].label }))}
          />
        </Field>
        <Field label="示例">
          <Input className="h-8" value={param.example} placeholder={PARAM_TYPE_META[param.type].example} onChange={(e) => onChange({ example: e.target.value })} aria-invalid={!param.example || undefined} />
        </Field>
        <Field label="最小长度">
          <Input className="h-8" type="number" min={0} value={param.minLength} onChange={(e) => onChange({ minLength: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="最大长度">
          <Input className="h-8" type="number" min={1} value={param.maxLength} onChange={(e) => onChange({ maxLength: Number(e.target.value) || 1 })} />
        </Field>
      </div>
    </div>
  )
}
