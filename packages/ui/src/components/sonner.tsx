'use client'

import * as React from 'react'
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner'

export { toast }

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton={false}
      toastOptions={{ duration: 2600 }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
