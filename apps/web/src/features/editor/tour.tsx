'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

import { Button } from '@aim/ui'
import { local } from '@aim/utils'
import { SparklesIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const STEPS = [
  { title: '左侧工具栏', body: '切换版式、添加元素、管理素材与参数、查看图层。' },
  {
    title: '所见即所得画布',
    body: '单击选中元素，双击文本直接编辑；顶部可切换厂商皮肤与参数显示。',
  },
  { title: '右侧属性面板', body: '编辑内容、样式与点击事件；文本框旁的 ✨ 可用 AI 生成文案。' },
  {
    title: '检查并提交',
    body: '右上角得分实时反映模板质量，点击「提交审核」完成快速检测、深度检测与三信融合确认。',
  },
]
const KEY = 'editor-tour-v1'

/** 新手引导（首次进入编辑器显示，可随时关闭） */
export function Tour() {
  const ec = useEditorCopy()

  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (!local.get(KEY, false)) setStep(0)
  }, [])
  if (step < 0) return null
  const done = () => {
    local.set(KEY, true)
    setStep(-1)
  }
  const s = STEPS[step]!
  return (
    <div
      className="bg-popover shadow-float animate-in fade-in-0 slide-in-from-bottom-2 absolute bottom-5 left-5 z-20 w-72 rounded-xl border p-4"
      role="dialog"
      aria-label={ec('e9d7d3c079d')}
    >
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <SparklesIcon className="text-primary size-4" />
        {s.title}
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground ml-auto"
          onClick={done}
          aria-label={ec('e30c443443d')}
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <p className="text-muted-foreground text-sm">{s.body}</p>
      <div className="mt-3 flex items-center">
        <span className="text-muted-foreground text-xs">
          {step + 1}/{STEPS.length}
        </span>
        <Button size="xs" variant="ghost" className="ml-auto" onClick={done}>
          {ec('efc50a99caa')}
        </Button>
        <Button size="xs" onClick={() => (step === STEPS.length - 1 ? done() : setStep(step + 1))}>
          {step === STEPS.length - 1 ? ec('ecfbdab8696') : ec('eacfc4e74a6')}
        </Button>
      </div>
    </div>
  )
}
