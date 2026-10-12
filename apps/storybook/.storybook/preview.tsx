import { TooltipProvider, Toaster } from '@aim/ui'
import { handlers } from '@aim/mock'
import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../src/styles.css'

// 与应用共用 @aim/mock 的 MSW handlers
initialize({ onUnhandledRequest: 'bypass', quiet: true })

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    msw: { handlers },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    options: { storySort: { order: ['介绍', 'UI', 'Mobile', 'Preview', 'Data'] } },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
        <Toaster />
      </TooltipProvider>
    ),
  ],
}

export default preview
