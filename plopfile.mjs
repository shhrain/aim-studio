/**
 * 脚手架
 *   pnpm gen:element   新增元素类型（schema props + core 默认值 + preview 渲染）
 *   pnpm gen:layout    新增版式（目录项 + 蓝图）
 *   pnpm gen:package   新增工作区包
 */
const isId = (v) => (/^[a-z][a-zA-Z0-9]*$/.test(v) ? true : '请使用小驼峰英文，如 couponWall')
const isCardId = (v) => (/^[a-z]+(\.[a-zA-Z0-9]+)+$/.test(v) ? true : '格式如 com.hbm.myLayout')

/** @param {import('plop').NodePlopAPI} plop */
export default function (plop) {
  plop.setGenerator('element', {
    description: '新增元素类型',
    prompts: [
      { type: 'input', name: 'type', message: '元素类型（小驼峰英文）', validate: isId },
      { type: 'input', name: 'label', message: '中文名称', default: '新元素' },
      {
        type: 'list',
        name: 'group',
        message: '分组',
        choices: ['basic', 'media', 'marketing', 'service', 'form'],
      },
    ],
    actions: [
      // 以下模式兼容 LF / CRLF：$2 为原换行符
      {
        type: 'modify',
        path: 'packages/template-schema/src/elements.ts',
        pattern: /(  'submitButton',)(\r?\n)(\] as const)/,
        template: "$1$2  '{{type}}',$2$3",
      },
      {
        type: 'modify',
        path: 'packages/template-schema/src/elements.ts',
        pattern:
          /(  submitButton: \{ label: '提交按钮', group: 'form', clickable: true \},)(\r?\n)/,
        template: "$1$2  {{type}}: { label: '{{label}}', group: '{{group}}', clickable: true },$2",
      },
      {
        type: 'modify',
        path: 'packages/template-schema/src/elements.ts',
        pattern: /(  submitButton: z\.object\(\{ text: z\.string\(\) \}\),)(\r?\n)/,
        template: '$1$2  {{type}}: z.object({ text: z.string() }),$2',
      },
      {
        type: 'modify',
        path: 'packages/template-core/src/elements/builtin.ts',
        pattern: /(\r?\n)(\]\r?\n\r?\n\/\/ eslint-disable-next-line)/,
        template:
          "$1  defineElement({ type: '{{type}}', label: '{{label}}', size: { w: W - 28, h: 48 }, defaults: () => ({ text: '{{label}}' }), texts: (el) => [el.props.text] }),$1$2",
      },
      {
        type: 'add',
        path: 'packages/template-preview/src/elements/custom/{{type}}.tsx',
        templateFile: 'scripts/templates/element.tsx.hbs',
      },
      {
        type: 'modify',
        path: 'packages/template-preview/src/elements/registry.tsx',
        pattern: /(\/\*\* 渲染单个元素内容)/,
        template:
          "definePreviewElement({ type: '{{type}}', Render: {{pascalCase type}}View })\n\n$1",
      },
      {
        type: 'modify',
        path: 'packages/template-preview/src/elements/registry.tsx',
        pattern: /(import \{ AgreementView)/,
        template: "import { {{pascalCase type}}View } from './custom/{{type}}'\n$1",
      },
      () => '完成。请补充 props 字段、默认值与渲染样式，然后运行 pnpm test 与 pnpm ai:generate。',
    ],
  })

  plop.setGenerator('layout', {
    description: '新增版式',
    prompts: [
      { type: 'input', name: 'id', message: 'cardId', validate: isCardId },
      { type: 'input', name: 'name', message: '版式名称', default: '新版式' },
      {
        type: 'list',
        name: 'group',
        message: '分组',
        choices: ['imageText', 'video', 'ecommerce', 'survey', 'select', 'notice', 'trip'],
      },
      { type: 'list', name: 'category', message: '分类', choices: ['service', 'notify'] },
    ],
    actions: [
      {
        type: 'modify',
        path: 'packages/template-schema/src/layouts.ts',
        pattern: /(  \/\* -+ 自由版式 -+ \*\/)/,
        templateFile: 'scripts/templates/layout-entry.hbs',
      },
      {
        type: 'modify',
        path: 'packages/template-core/src/layouts/blueprints.ts',
        pattern: /(  \/\* -+ 自由版式 -+ \*\/)/,
        templateFile: 'scripts/templates/layout-blueprint.hbs',
      },
      () => '完成。运行 pnpm --filter @aim/template-core test 校验，并在编辑器「版式画廊」中目测。',
    ],
  })

  plop.setGenerator('package', {
    description: '新增工作区包',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: '包名（不含 @aim/）',
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : '小写字母、数字、短横线'),
      },
      { type: 'input', name: 'description', message: '描述' },
      { type: 'confirm', name: 'react', message: '是否包含 React 组件？', default: false },
    ],
    actions: [
      {
        type: 'add',
        path: 'packages/{{name}}/package.json',
        templateFile: 'scripts/templates/package.json.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{name}}/tsconfig.json',
        templateFile: 'scripts/templates/tsconfig.json.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{name}}/eslint.config.js',
        templateFile: 'scripts/templates/eslint.config.js.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{name}}/src/index.ts',
        template: "export const name = '@aim/{{name}}'\n",
      },
      () => '完成。运行 pnpm install 链接工作区依赖。',
    ],
  })
}
