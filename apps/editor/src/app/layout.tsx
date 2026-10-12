import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'AIM Studio · 阅信模板编辑器', template: '%s · AIM Studio' },
  description: '5G 阅信模板制作平台：多版式、多厂商预览、三信融合转换与审核提交',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
