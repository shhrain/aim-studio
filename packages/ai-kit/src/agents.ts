import { counts, layoutsSummaryTable } from './tables'

/** AGENTS.md 生成区块 */
export function buildAgentsSection(): string {
  const c = counts()
  return `<!-- ai-kit:generated:start -->
<!-- 以下内容由 \`pnpm ai:generate\` 根据 template-schema 自动生成，请勿手改 -->

## 模板能力速查（自动生成）

- 标准版式 ${c.layouts} 种（+1 自由版式）、元素 ${c.elements} 种、点击事件 ${c.actions} 种、厂商 ${c.vendors} 个。
- 完整规范：\`packages/ai-kit/PROMPT.md\`、文档站 \`/docs/spec/*\`、\`/llms.txt\`。

${layoutsSummaryTable()}

<!-- ai-kit:generated:end -->`
}
