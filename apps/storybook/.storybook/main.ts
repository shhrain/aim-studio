import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  async viteFinal(cfg) {
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()]
    return cfg
  },
}

export default config
