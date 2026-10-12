'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Textarea,
  toast,
} from '@aim/ui'
import { useState } from 'react'
import { editorApi } from '@/lib/api'

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>意见反馈</DialogTitle>
          <DialogDescription>遇到问题或有改进建议？告诉我们。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="反馈内容" required>
            <Textarea
              rows={5}
              maxLength={500}
              showCount
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请描述问题出现的步骤或期望的功能"
            />
          </Field>
          <Field label="联系方式">
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="手机号 / 邮箱（选填）"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!content.trim()}
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await editorApi.feedback({ content, contact, page: location.pathname })
                toast.success('感谢反馈，我们会尽快处理')
                setContent('')
                onOpenChange(false)
              } finally {
                setLoading(false)
              }
            }}
          >
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
