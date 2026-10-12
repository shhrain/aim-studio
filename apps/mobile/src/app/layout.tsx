import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: '5G 阅信体验', template: '%s · 5G 阅信体验' },
  description: '体验 5G 阅信富媒体消息：模板浏览、测试发送、能力查询与三信融合',
  referrer: 'no-referrer',
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2f6bff',
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
