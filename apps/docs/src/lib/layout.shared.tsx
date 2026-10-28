import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpenIcon, PenToolIcon, SmartphoneIcon } from 'lucide-react'
import { appName } from './shared'

export const appUrls = {
  editor:
    process.env.NEXT_PUBLIC_WEB_URL ??
    process.env.NEXT_PUBLIC_EDITOR_URL ??
    'http://localhost:3000',
  mobile:
    process.env.NEXT_PUBLIC_MOBILE_URL ??
    (process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000') + '/m',
  storybook: process.env.NEXT_PUBLIC_STORYBOOK_URL ?? '',
}

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
      {
        type: 'icon',
        text: '业务控制台',
        label: '打开业务控制台',
        icon: <PenToolIcon />,
        url: appUrls.editor,
        external: true,
      },
      {
        type: 'icon',
        text: '移动端体验',
        label: '打开移动端体验',
        icon: <SmartphoneIcon />,
        url: appUrls.mobile,
        external: true,
      },
      ...(appUrls.storybook
        ? [
            {
              type: 'icon' as const,
              text: '组件库 Storybook',
              label: '打开 Storybook',
              icon: <BookOpenIcon />,
              url: appUrls.storybook,
              external: true,
            },
          ]
        : []),
    ],
  }
}
