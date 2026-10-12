import { counts } from './tables'

/** Cursor 规则（.cursor/rules/*.mdc） */
export function buildCursorRules(): Record<string, string> {
  const c = counts()
  return {
    'aim-project.mdc': `---
description: AIM Studio 项目约定（全局）
alwaysApply: true
---

# AIM Studio 项目约定

- 业务：5G 阅信（AIM）模板平台。完整知识见 \`packages/ai-kit/PROMPT.md\`，回答使用简体中文。
- 依赖方向：template-schema ← template-core ← template-preview ← apps；api-client ← mock / apps；ui ← apps。
- 修改模板文档只用 \`@aim/template-core\` 的函数；接口只用 \`@aim/api-client\`；UI 只用 \`@aim/ui\`。
- 版式 ${c.layouts} 种、元素 ${c.elements} 种、事件 ${c.actions} 种、厂商 ${c.vendors} 个，以 \`@aim/template-schema\` 为准，不得编造 ID。
- 参数语法 \`{#参数名#}\`，协议导出为 \`\${参数名}\`。
- 依赖版本写在 \`pnpm-workspace.yaml\` 的 catalog，包内用 \`catalog:\`，内部包用 \`workspace:*\`。
- 改完运行：\`pnpm typecheck && pnpm lint && pnpm test\`；修改 schema 后 \`pnpm ai:generate\`；修改可发布包后 \`pnpm changeset\`。
`,
    'aim-template-schema.mdc': `---
description: 模板协议包约束
globs: packages/template-schema/**
alwaysApply: false
---

- 只放类型、Zod Schema 与静态目录数据，不依赖 React、DOM、Node API。
- 新增版式：在 \`LAYOUTS\` 中声明槽位（maxLength / ratios / count / limits / repeat）、settings、vendors、protocols，并在 template-core 补充蓝图。
- 新增元素：同步 \`ELEMENT_TYPES\`、\`ELEMENT_META\`、\`elementPropsSchemas\`（字段使用 zod，默认值写在 core 的 builtin）。
- 修改后运行 \`pnpm --filter @aim/template-schema test\` 与 \`pnpm ai:generate\`。
`,
    'aim-template-core.mdc': `---
description: 模板内核包约束
globs: packages/template-core/**
alwaysApply: false
---

- 纯函数、不可变更新：所有文档操作返回新对象，不得修改入参。
- 不访问 DOM（转换器的 getTextParam 已用正则实现，可在 Node / SSR 运行）。
- 扩展能力用 \`defineElement / defineBlueprint / defineConverter / defineRule\` + \`registerPlugin\`。
- 三信融合转换：\`legacy\` 模式必须与 \`test/reference\` 原实现逐字段一致（parity 测试），改进只放在 \`fixed\` 模式。
- 预检规则返回 \`PrecheckIssue\`，message 需说明原因，suggestion 给出修复方式。
`,
    'aim-template-preview.mdc': `---
description: 预览 SDK 约束
globs: packages/template-preview/**
alwaysApply: false
---

- 样式只写在 \`src/styles.css\`：类名前缀 \`aim-\`、变量前缀 \`--aim-\`，不使用 Tailwind、不依赖 \`@aim/ui\`。
- 尺寸使用画布单位 \`u(n)\` → \`calc(var(--u) * n)\`（--u = 容器宽 / 342），禁止 transform: scale。
- 富文本只通过 \`renderTextHtml\` / \`renderTextPlain\` 输出（确定性净化，SSR 一致）。
- 点击统一走 \`useAct()\`：编辑态只选中，intercept 只回调，native 才执行。
- 新元素渲染用 \`definePreviewElement\`，复合 / 文本元素声明 \`autoHeight\`。
- 修改后运行 \`pnpm --filter @aim/template-preview test\` 并在编辑器「版式画廊」目测。
`,
    'aim-apps.mdc': `---
description: 应用层约定（编辑器 / 移动端）
globs: apps/editor/**, apps/mobile/**
alwaysApply: false
---

- Next.js 16 App Router：页面文件为服务端组件，交互逻辑放在同目录 \`*-view.tsx\`（'use client'）。
- 数据请求使用 \`@/lib/api\` 导出的 api / hooks；错误由 http 客户端统一 toast，9001 统一跳转登录。
- 编辑器状态在 \`features/editor/store.ts\`（zustand + zundo）；修改文档用 \`update(fn)\` 或 \`mutateElement(id, recipe)\`。
- 移动端使用 \`@aim/ui/mobile\` 组件，处理安全区；预览用 \`mode="fluid"\` 或 \`TemplateThumbnail\`。
- 交互规范：主操作唯一、破坏性操作二次确认、空状态给出下一步、加载使用骨架屏。
`,
  }
}
