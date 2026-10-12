import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** 所有包共享的基础规则：TS 推荐规则 + 关闭与 Prettier 冲突的格式规则 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.source/**',
      '**/storybook-static/**',
      '**/coverage/**',
      '**/public/mockServiceWorker.js',
      '**/test/reference/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
    },
  },
  prettier,
)
