'use client'

import { applySettings, toFreeLayout, updatePageStyle } from '@aim/template-core'
import {
  RECOGNITION_LABEL,
  TEMPLATE_CATEGORY_LABEL,
  TEMPLATE_NAME_MAX,
  VENDORS,
  getLayout,
  type RecognitionType,
  type TemplateUsage,
} from '@aim/template-schema'
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Field,
  FieldGroup,
  Input,
  RadioOptions,
  Segmented,
  SimpleSelect,
  Switch,
  cn,
} from '@aim/ui'
import { CheckIcon, MoveIcon } from 'lucide-react'
import { useState } from 'react'
import { useEditor } from '../store'
import { MediaInput } from './media-input'

export function TemplateSettings() {
  const doc = useEditor((s) => s.doc)!
  const update = useEditor((s) => s.update)
  const [confirmFree, setConfirmFree] = useState(false)
  const layout = getLayout(doc.layoutId)
  const page = doc.pages[0]!
  const set = (patch: Partial<typeof doc>) => update((d) => ({ ...d, ...patch }))

  return (
    <div className="space-y-6">
      <FieldGroup title="基本信息">
        <Field label="模板名称" required extra={`${[...doc.name].length}/${TEMPLATE_NAME_MAX}`}>
          <Input
            value={doc.name}
            maxLength={TEMPLATE_NAME_MAX}
            placeholder="请输入模板名称"
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label="模板用途" description="测试模板仅用于内部联调，不可正式下发">
          <Segmented
            block
            value={doc.usage}
            onValueChange={(v: TemplateUsage) => set({ usage: v })}
            options={[
              { value: 'commercial', label: '商用' },
              { value: 'test', label: '测试' },
            ]}
          />
        </Field>
        <Field
          label="识别类型"
          description="短链识别：短信中的短链被识别为阅信；文本识别：按短信文本特征识别"
        >
          <RadioOptions
            value={doc.recognition}
            onValueChange={(v: RecognitionType) => set({ recognition: v })}
            options={(Object.keys(RECOGNITION_LABEL) as RecognitionType[]).map((v) => ({
              value: v,
              label: RECOGNITION_LABEL[v],
            }))}
          />
        </Field>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          版式：<Badge variant="soft">{layout?.name}</Badge>
          <Badge variant="outline">{TEMPLATE_CATEGORY_LABEL[doc.category]}</Badge>
        </div>
      </FieldGroup>

      <FieldGroup title={`发送厂商（${doc.vendors.length}）`}>
        <div className="grid grid-cols-2 gap-1.5">
          {(layout?.vendors ?? []).map((v) => {
            const on = doc.vendors.includes(v)
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  set({ vendors: on ? doc.vendors.filter((x) => x !== v) : [...doc.vendors, v] })
                }
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm transition',
                  on
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:border-primary/40',
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: VENDORS[v].brandColor }}
                />
                {VENDORS[v].name}
                {on && <CheckIcon className="ml-auto size-4" />}
              </button>
            )
          })}
        </div>
        {doc.vendors.length === 0 && <Alert variant="warning">至少选择一个厂商才能提交审核</Alert>}
        <p className="text-muted-foreground text-xs">仅列出「{layout?.name}」已上架的厂商。</p>
      </FieldGroup>

      {layout?.settings?.length ? (
        <FieldGroup title="版式设置">
          {layout.settings.map((s) => (
            <Field key={s.key} label={s.label} description={s.help}>
              {s.kind === 'select' ? (
                <SimpleSelect
                  value={String(doc.settings[s.key] ?? s.defaultValue)}
                  onValueChange={(v) =>
                    update((d) =>
                      applySettings(d, {
                        [s.key]: s.options?.find((o) => String(o.value) === v)?.value ?? v,
                      }),
                    )
                  }
                  options={(s.options ?? []).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                />
              ) : s.kind === 'switch' ? (
                <Switch
                  checked={Boolean(doc.settings[s.key])}
                  onCheckedChange={(v) => update((d) => applySettings(d, { [s.key]: v }))}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(s.options ?? []).map((o) => {
                    const active = String(doc.settings[s.key] ?? s.defaultValue) === String(o.value)
                    return (
                      <button
                        key={String(o.value)}
                        type="button"
                        onClick={() => update((d) => applySettings(d, { [s.key]: o.value }))}
                        className={cn(
                          'h-8 min-w-12 rounded-md border px-2.5 text-sm transition',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'hover:border-primary/40',
                        )}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </Field>
          ))}
          {page.mode === 'absolute' && (
            <p className="text-warning-foreground text-xs">
              自由排版状态下修改版式设置将重新生成布局。
            </p>
          )}
        </FieldGroup>
      ) : null}

      <FieldGroup title="卡片背景">
        <Field label="背景色">
          <div className="flex items-center gap-1.5">
            <label
              className="relative size-8 shrink-0 overflow-hidden rounded-md border"
              style={{ background: page.style.backgroundColor }}
            >
              <input
                type="color"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={
                  /^#[0-9a-f]{6}$/i.test(page.style.backgroundColor ?? '')
                    ? page.style.backgroundColor
                    : '#ffffff'
                }
                onChange={(e) =>
                  update((d) => updatePageStyle(d, { backgroundColor: e.target.value }))
                }
              />
            </label>
            <Input
              className="h-8"
              value={page.style.backgroundColor ?? ''}
              onChange={(e) =>
                update((d) => updatePageStyle(d, { backgroundColor: e.target.value }))
              }
            />
          </div>
        </Field>
        <Field label="背景图">
          <MediaInput
            value={page.style.backgroundImage ?? ''}
            onChange={(url) =>
              update((d) => updatePageStyle(d, { backgroundImage: url || undefined }))
            }
          />
        </Field>
        {page.mode === 'absolute' && (
          <Field label="卡片高度">
            <Input
              type="number"
              value={page.style.height}
              min={120}
              max={1600}
              onChange={(e) =>
                update((d) => updatePageStyle(d, { height: Number(e.target.value) || 120 }))
              }
            />
          </Field>
        )}
      </FieldGroup>

      {page.mode === 'flow' && !layout?.free && (
        <FieldGroup title="排版模式">
          <p className="text-muted-foreground text-xs leading-relaxed">
            结构化版式按厂商规范自动排版。转为自由排版后可拖拽调整每个元素的位置与尺寸。
          </p>
          <Button variant="outline" size="sm" onClick={() => setConfirmFree(true)}>
            <MoveIcon />
            转为自由排版
          </Button>
          <ConfirmDialog
            open={confirmFree}
            onOpenChange={setConfirmFree}
            title="转为自由排版？"
            description="元素将固定为当前坐标，文本不再随内容自动撑高。可通过撤销恢复。"
            onConfirm={() => update(toFreeLayout)}
          />
        </FieldGroup>
      )}
    </div>
  )
}
