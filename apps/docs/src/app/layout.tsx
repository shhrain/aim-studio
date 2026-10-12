import { RootProvider } from 'fumadocs-ui/provider/next'
import type { Metadata } from 'next'
import './global.css'

export const metadata: Metadata = {
  title: { default: 'AIM Studio 文档', template: '%s · AIM Studio 文档' },
  description: '5G 阅信模板平台：产品指南、模板规范、预览 SDK、三信融合转换协议与工程架构',
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
