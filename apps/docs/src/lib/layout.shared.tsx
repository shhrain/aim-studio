import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { appName } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <span className="bg-fd-primary text-fd-primary-foreground flex size-6 items-center justify-center rounded-md text-xs">
            A
          </span>
          {appName}
        </span>
      ),
    },
    links: [
      { text: '文档', url: '/docs' },
      { text: '模板规范', url: '/docs/spec/layouts' },
      { text: '预览 SDK', url: '/docs/sdk' },
      { text: 'llms.txt', url: '/llms.txt', external: true },
    ],
  }
}
