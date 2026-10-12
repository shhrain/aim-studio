import nextPlugin from '@next/eslint-plugin-next'
import tseslint from 'typescript-eslint'
import reactConfig from './react.js'

export default tseslint.config(...reactConfig, {
  files: ['**/*.{ts,tsx}'],
  plugins: { '@next/next': nextPlugin },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    '@next/next/no-img-element': 'off',
  },
})
