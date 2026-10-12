export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'repo',
        'editor',
        'mobile',
        'docs',
        'storybook',
        'ui',
        'schema',
        'core',
        'preview',
        'api',
        'mock',
        'ai-kit',
        'utils',
        'tooling',
        'e2e',
        'deps',
      ],
    ],
  },
}
