'use client'

import { TemplateThumbnail } from '@aim/template-preview'
import { LAYOUT_GROUPS, getLayout } from '@aim/template-schema'
import { Badge, Button } from '@aim/ui'
import { RepeatIcon } from 'lucide-react'
import { useEditor } from '../store'

export function LayoutsPanel({ onSwitch }: { onSwitch: () => void }) {
  const doc = useEditor((s) => s.doc)
  if (!doc) return null
  const layout = getLayout(doc.layoutId)
  return (
    <div className="space-y-4 p-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="canvas-grid max-h-56 overflow-hidden px-6 pt-4">
          <TemplateThumbnail document={doc} paramDisplay="example" />
        </div>
        <div className="space-y-1.5 border-t p-3">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{layout?.name}</span>
            {layout && <Badge variant="outline">{LAYOUT_GROUPS[layout.group].label}</Badge>}
            {layout?.protocols.includes('rcs') && <Badge variant="success">三信融合</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{layout?.description}</p>
        </div>
      </div>
      <Button variant="outline" block onClick={onSwitch}>
        <RepeatIcon />
        更换版式
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">更换版式时，标题、描述、主图、按钮等同名槽位的内容会自动迁移到新版式。</p>
      {layout && (
        <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-xs">
          <div className="font-medium">字段规范</div>
          <ul className="space-y-1 text-muted-foreground">
            {layout.slots.map((s) => (
              <li key={s.key} className="flex justify-between gap-2">
                <span>
                  {s.label}
                  {s.required && <span className="text-destructive">*</span>}
                </span>
                <span>{s.maxLength ? `≤${s.maxLength}字` : s.count ? `${s.count.min}-${s.count.max}项` : s.ratios ? s.ratios.map((r) => r.join(':')).join(' / ') : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
