# AIM Studio

5G 阅信（AIM）模板平台。主站提供落地页、账号、工作空间和控制台；模板在工作空间内创作、审核和发布。移动体验、文档站和预览 SDK 仍独立存在。正式数据由 PostgreSQL 与 `@aim/api` 持久化，Mock 只用于组件开发和显式演示。

## 快速开始

```bash
pnpm install
pnpm db:migrate          # 需要本机 PostgreSQL，并设置 DATABASE_URL
pnpm dev:api             # http://localhost:4000  API
pnpm --filter @aim/api worker
pnpm dev:web             # http://localhost:3000  主站（旧命令 dev:editor 仍指向这里）
pnpm dev:mobile          # http://localhost:3001  移动体验；Docker 中挂在主站 /m
pnpm dev:docs            # http://localhost:3002  文档站
pnpm storybook           # http://localhost:6006
```

本地注册和找回密码需要 SMTP。Docker 开发配置会带上 Mailpit（`http://localhost:8025`）。环境要求：Node 24（见 `.nvmrc`），pnpm 9.15+。

主站语言前缀为 `zh-CN` 与 `en`。注册并验证邮箱后创建工作空间，再进入 `/{locale}/app/w/{workspaceId}`。

## Docker 一键部署

只需 Docker（含 Compose v2）。首次运行会生成随机数据库密码和认证密钥，没有预置管理员。

```bash
bash deploy/deploy.sh up
# Windows
powershell -ExecutionPolicy Bypass -File .\deploy\deploy.ps1 up
```

默认地址：主站 `http://localhost:3000`，移动体验 `http://localhost:3000/m`，文档 `http://localhost:3002`。常用命令：`status`、`logs`、`doctor`、`migrate`、`backup`、`restore`、`update`、`down`（保留数据卷）。说明见 [deploy/README.md](deploy/README.md) 与文档站「Docker 部署」。

## 仓库结构

| 路径                        | 说明                                                      |
| --------------------------- | --------------------------------------------------------- |
| `apps/web`                  | 主站 `@aim/web`：落地页、账号、工作空间、控制台与模板创作 |
| `apps/api`                  | `@aim/api`：认证、业务接口和独立任务进程                  |
| `apps/mobile`               | 移动体验 H5，读取已发布版本                               |
| `apps/docs`                 | 文档站                                                    |
| `apps/storybook`            | 组件与预览矩阵，部署时可选                                |
| `packages/api-contracts`    | 请求模型、错误码、分页和权限，不依赖数据库或 React        |
| `packages/db`               | Drizzle 表结构、迁移和种子，仅服务端引用                  |
| `packages/i18n`             | 中英文词典                                                |
| `packages/api-client`       | 浏览器与应用访问 API 的入口                               |
| `packages/template-schema`  | 模板协议、版式目录、校验                                  |
| `packages/template-core`    | 文档操作、预检、AIM→RCS/RMS 转换                          |
| `packages/template-preview` | 可嵌入的预览 SDK                                          |
| `packages/ui`               | 共享界面组件                                              |
| `packages/mock`             | 仅组件开发、测试和显式演示                                |
| `deploy`                    | Compose、网关、迁移、备份与部署脚本                       |

## 常用命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter @aim/api test:integration   # 需要真实 PostgreSQL
pnpm test:e2e
PW_VISUAL=1 pnpm test:e2e   # 视觉回归（基线按平台保存，CI 默认跳过）
pnpm db:generate    # 生成迁移，生产禁止 drizzle-kit push
pnpm ai:generate
pnpm gen:element
pnpm gen:layout
pnpm changeset
```

视觉回归基线保存在 `e2e/tests/visual.spec.ts-snapshots/`，文件名包含平台。新平台首次运行：`PW_VISUAL=1 pnpm test:e2e -- --update-snapshots`。

## AI 协作

先读 [`AGENTS.md`](AGENTS.md)、[`packages/ai-kit/PROMPT.md`](packages/ai-kit/PROMPT.md) 和文档站「平台、账号与业务流程」。模板协议包不放账号或数据库；业务请求走 `@aim/api-client`；不要信任客户端传入的租户、审核状态或预检结果。
