import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import base from './base.js'

export default tseslint.config(...base, {
  files: ['**/*.{ts,tsx}'],
  plugins: { react, 'react-hooks': reactHooks },
  settings: { react: { version: 'detect' } },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
    'react/prop-types': 'off',
    'react/no-unknown-property': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
})
