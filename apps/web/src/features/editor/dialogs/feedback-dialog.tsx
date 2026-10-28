'use client'
import { useEditorCopy } from '@/features/editor/lib/copy'

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
  const ec = useEditorCopy()

  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{ec('e2745ccb884')}</DialogTitle>
          <DialogDescription>{ec('ee93e0ea35f')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={ec('e0215ff0b3c')} required>
            <Textarea
              rows={5}
              maxLength={500}
              showCount
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={ec('ed308dc98ac')}
            />
          </Field>
          <Field label={ec('e323a881ebd')}>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={ec('e669ca5e8f8')}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {ec('e2cd0f3be87')}
          </Button>
          <Button
            disabled={!content.trim()}
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await editorApi.feedback({ content, contact, page: location.pathname })
                toast.success(ec('e0f35014f23'))
                setContent('')
                onOpenChange(false)
              } finally {
                setLoading(false)
              }
            }}
          >
            {ec('e08a85f4ab4')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
