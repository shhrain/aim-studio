# AIM Studio

5G 阅信（AIM）模板平台 Monorepo。包含模板编辑器、移动端体验 H5、可复用的模板预览 SDK、模板协议内核、文档站与组件工作台。所有后端接口由本地 Mock（MSW + fixtures）提供，开箱即可运行。

## 快速开始

```bash
pnpm install
pnpm dev            # 同时启动 editor / mobile / docs
pnpm dev:editor     # http://localhost:3000  模板编辑器
pnpm dev:mobile     # http://localhost:3001  移动端体验 H5
pnpm dev:docs       # http://localhost:3002  文档站
pnpm storybook      # http://localhost:6006  组件与预览矩阵
```

> 环境要求：Node >= 20.9（推荐 24，见 `.nvmrc`），pnpm 9.15+。

## 仓库结构

| 路径                        | 说明                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `apps/editor`               | Next.js 模板编辑器（PC）：版式库、画布、属性面板、参数、预检、多厂商预览、提交审核    |
| `apps/mobile`               | Next.js 5G 阅信体验 H5：模板列表/详情、测试发送、发送记录、通讯录、能力查询、扫码预览 |
| `apps/docs`                 | Fumadocs 文档站：产品指南、模板规范、预览 SDK、转换协议、架构、AI 使用                |
| `apps/storybook`            | Storybook：UI 组件 + 版式 × 厂商 × 协议 预览矩阵                                      |
| `packages/template-schema`  | 模板协议：类型与 Zod Schema、版式目录、槽位与字数限制、事件、参数、厂商矩阵           |
| `packages/template-core`    | 模板内核：文档操作、插件注册、校验与预检、AIM→RCS/RMS 转换、旧数据适配                |
| `packages/template-preview` | 模板预览 SDK：React 渲染器、手机壳、厂商主题、多协议、iframe 嵌入、Web Component      |
| `packages/ui`               | 企业级 UI 组件（shadcn/ui + Radix + Tailwind v4）                                     |
| `packages/api-client`       | 类型化接口层 + TanStack Query hooks                                                   |
| `packages/mock`             | MSW handlers + fixtures，浏览器 / Node / Storybook / E2E 复用                         |
| `packages/ai-kit`           | 面向 AI 编程 Agent 的提示词、规则与示例                                               |
| `packages/utils`            | 通用工具                                                                              |
| `tooling/*`                 | 共享 tsconfig / eslint / tailwind token / vitest 配置                                 |
| `e2e`                       | Playwright 端到端与视觉回归                                                           |

## 常用命令

```bash
pnpm build          # 全量构建（turbo 缓存）
pnpm lint           # ESLint
pnpm typecheck      # TypeScript 类型检查
pnpm test           # 单元测试（Vitest）
pnpm test:e2e       # 端到端 + 视觉回归（Playwright，复用已启动的 dev 服务）
pnpm test:e2e:update  # 更新视觉基准图（基准按平台区分，新平台首次需运行）
pnpm ai:generate    # 从 schema 重新生成 AI 提示词 / 规则 / 规范文档
pnpm gen:element    # 脚手架：新增元素类型
pnpm gen:layout     # 脚手架：新增版式
pnpm changeset      # 记录可发布包的变更
```

## Mock 与真实后端

默认 `NEXT_PUBLIC_API_MOCK=true`，浏览器端由 MSW 拦截全部接口，数据持久化在 IndexedDB。接入真实后端时设为 `false` 并配置 `NEXT_PUBLIC_API_BASE`，业务代码无需修改（只依赖 `@aim/api-client` 的契约）。

## AI 协作

给任意 AI 编程 Agent 使用前，先让它读取 [`packages/ai-kit/PROMPT.md`](packages/ai-kit/PROMPT.md) 与根目录 [`AGENTS.md`](AGENTS.md)。
