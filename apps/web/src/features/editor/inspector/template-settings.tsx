'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

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
  const ec = useEditorCopy()

  const doc = useEditor((s) => s.doc)!
  const update = useEditor((s) => s.update)
  const [confirmFree, setConfirmFree] = useState(false)
  const layout = getLayout(doc.layoutId)
  const page = doc.pages[0]!
  const set = (patch: Partial<typeof doc>) => update((d) => ({ ...d, ...patch }))

  return (
    <div className="space-y-6">
      <FieldGroup title={ec('ee8df058725')}>
        <Field
          label={ec('ef7816a356d')}
          required
          extra={`${[...doc.name].length}/${TEMPLATE_NAME_MAX}`}
        >
          <Input
            value={doc.name}
            maxLength={TEMPLATE_NAME_MAX}
            placeholder={ec('e1f62845bc0')}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <Field label={ec('ed23a88a71a')} description={ec('e2914e9abee')}>
          <Segmented
            block
            value={doc.usage}
            onValueChange={(v: TemplateUsage) => set({ usage: v })}
            options={[
              { value: 'commercial', label: ec('ea80f2a2ab9') },
              { value: 'test', label: ec('e6aa8f49cc9') },
            ]}
          />
        </Field>
        <Field label={ec('e399a491843')} description={ec('e2dcac9c9ba')}>
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
          {ec('e670b95670e')}
          <Badge variant="soft">{layout?.name}</Badge>
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
        {doc.vendors.length === 0 && <Alert variant="warning">{ec('ea8b88b398c')}</Alert>}
        <p className="text-muted-foreground text-xs">
          {ec('e30c27c0352')}
          {layout?.name}
          {ec('e8a8dcfa068')}
        </p>
      </FieldGroup>

      {layout?.settings?.length ? (
        <FieldGroup title={ec('e2b49b53d87')}>
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
            <p className="text-warning-foreground text-xs">{ec('eebfb5a3754')}</p>
          )}
        </FieldGroup>
      ) : null}

      <FieldGroup title={ec('e7a284abb57')}>
        <Field label={ec('e6d2b296c1c')}>
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
        <Field label={ec('e75bde8e3bb')}>
          <MediaInput
            value={page.style.backgroundImage ?? ''}
            onChange={(url) =>
              update((d) => updatePageStyle(d, { backgroundImage: url || undefined }))
            }
          />
        </Field>
        {page.mode === 'absolute' && (
          <Field label={ec('e47e68de90b')}>
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
        <FieldGroup title={ec('e59f574678e')}>
          <p className="text-muted-foreground text-xs leading-relaxed">{ec('e23c375c4b9')}</p>
          <Button variant="outline" size="sm" onClick={() => setConfirmFree(true)}>
            <MoveIcon />
            {ec('e7985084da8')}
          </Button>
          <ConfirmDialog
            open={confirmFree}
            onOpenChange={setConfirmFree}
            title={ec('eccf420791e')}
            description={ec('e02ac4608ec')}
            onConfirm={() => update(toFreeLayout)}
          />
        </FieldGroup>
      )}
    </div>
  )
}
