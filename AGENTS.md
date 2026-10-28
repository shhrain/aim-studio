# AGENTS.md — AIM Studio 协作约定

> 面向 AI 编程 Agent 与新成员。完整产品与模板知识见 `packages/ai-kit/PROMPT.md`。

## 产品一句话

AIM Studio 是 5G 阅信（AIM，Android 厂商富媒体消息）模板平台。用户在工作空间里选择版式、填写槽位、配置点击事件与参数，预览多厂商效果后提交内部审核并发布；同一份模板可转换为 RCS（5G 消息 / iPhone）与 RMS（彩信）协议做三信融合下发。主站是 `apps/web`，服务端是 `apps/api`。

## 依赖方向（不可反向）

```
template-schema  <-  template-core  <-  template-preview  <-  apps/*
utils            <-  (all)
api-contracts    <-  api-client / db / apps/api / apps/web
db               <-  apps/api
i18n             <-  apps/web
api-client       <-  mock / apps/*
ui               <-  apps/*, storybook
```

- `template-schema` 只放类型、Zod Schema、静态目录数据，**不得**依赖 React、DOM、数据库或账号。
- `template-core` 纯函数，可在 Node / 浏览器 / Worker 运行，**不得**访问 DOM。
- `template-preview` 只依赖 schema/core/utils，样式写在自带的 `styles.css`（`aim-` 前缀 + CSS 变量），**不得**依赖 Tailwind 或 `@aim/ui`，保证任意宿主可嵌入。
- `api-contracts` 只放 Zod 模型、错误码和权限，不依赖数据库或 React。`db` 只允许服务端引用。
- 应用通过 `@aim/api-client` 访问接口，**不得**直接 `fetch` 业务接口。不要信任客户端传入的 `whois`、创建者、审核状态或 `precheckPassed`。

## 约定

- TypeScript strict；导出的公共 API 必须有类型与 JSDoc。
- 所有外部依赖版本写在 `pnpm-workspace.yaml` 的 `catalog`，包内用 `catalog:`；内部包用 `workspace:*`。运行 `pnpm check:deps` 校验。
- 新增元素类型 / 版式使用脚手架：`pnpm gen:element`、`pnpm gen:layout`。
- 主站文案走 `@aim/i18n`（`zh-CN` / `en`）。用户可见的错误需给出可执行的下一步，逻辑判断使用错误码而不是中文字符串。
- 模板参数占位统一 `{#参数名#}`；协议导出时转为 `${参数名}`。
- 用户输入的富文本渲染前必须经过 `@aim/utils` 的 `sanitizeHtml`。
- 修改可发布包需 `pnpm changeset`。
- 由 Mock 提供的资源（如验证码图片）必须经 `fetch` 获取：非安全上下文下 Mock 降级为页面内 fetch 拦截，`<img src>` 等直接请求不会被拦截。
- 新增跨应用地址、构建期环境变量时，同步更新 `deploy/docker-compose.yml` 的 build args、`deploy/.env.example` 与 `turbo.json` 的 `globalEnv`。

## 部署

```bash
bash deploy/deploy.sh up          # Docker 一键部署（Windows：deploy/deploy.ps1 up）
bash deploy/deploy.sh config      # 打印地址与模式（不需要 Docker，不打印密钥）
bash deploy/deploy.sh doctor      # 检查 Compose、容器和 HTTP 入口
```

`down` 保留数据卷。生产使用版本化 SQL 迁移，不要在启动时执行 `drizzle-kit push`。

详见 `deploy/README.md` 与 `apps/docs/content/docs/deployment.mdx`。

## 验证

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @aim/template-core test      # 转换器对照测试
pnpm test:e2e                               # 端到端 + 视觉回归
```

<!-- ai-kit:generated:start -->
<!-- 以下内容由 `pnpm ai:generate` 根据 template-schema 自动生成，请勿手改 -->

## 模板能力速查（自动生成）

- 标准版式 33 种（+1 自由版式）、元素 32 种、点击事件 15 种、厂商 8 个。
- 完整规范：`packages/ai-kit/PROMPT.md`、文档站 `/docs/spec/*`、`/llms.txt`。

| 版式 | cardId | 分组 | 分类 | 三信融合 | 厂商数 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 图文 | `com.hbm.imageandtext` | 图文 | 服务类 | ✓ | 7 | 大图 + 标题 + 描述 + 按钮，最通用的营销与服务版式 |
| 横滑 | `com.hbm.sideslip` | 图文 | 服务类 |  | 5 | 多张卡片横向滑动浏览，每张卡片含图、标题、正文与按钮 |
| 多图文 | `com.hbm.standardimageandtext` | 图文 | 服务类 |  | 7 | 头条大图 + 多条图文列表，适合资讯、活动合集 |
| 多图文(新) | `com.hbm.standardimageandtext2.v2` | 图文 | 服务类 |  | 5 | 左文右图的多条资讯列表，信息密度更高 |
| 图片轮播 | `com.hbm.carouselImageSixteenToNine` | 图文 | 服务类 | ✓ | 7 | 多图自动轮播 + 标题 + 长描述 + 按钮 |
| 图片轮播(新) | `com.hbm.carouselImage.v2` | 图文 | 服务类 |  | 5 | 轮播图 + 双按钮，适合多商品/多活动露出 |
| 长文本 | `com.hbm.pureText` | 图文 | 服务类 |  | 7 | 标题 + 长正文（最多 350 字），适合公告、说明类内容 |
| 海报 | `com.hbm.poster` | 图文 | 服务类 |  | 7 | 整张竖版海报，可配置点击跳转 |
| 视频图文 | `com.hbm.video` | 视频图文 | 服务类 | ✓ | 7 | 视频 + 标题 + 描述 + 按钮 |
| 图文视频 | `com.hbm.imageVideo` | 视频图文 | 服务类 |  | 5 | 先文字后视频，突出文案 |
| 视频 | `com.hbm.pureVideo` | 视频图文 | 服务类 |  | 5 | 大尺寸视频 + 简短文字 |
| 短剧图片 | `com.hbm.shortVideoImage.v2` | 视频图文 | 服务类 |  | 2 | 竖版剧照 + 双按钮（立即观看 / 追剧） |
| 短剧视频 | `com.hbm.shortVideo.v2` | 视频图文 | 服务类 |  | 2 | 竖版短剧视频 + 双按钮 |
| 视频轮播 | `com.hbm.carouselVideo` | 视频图文 | 服务类 |  | 5 | 多个视频轮播展示 |
| 电商 | `com.hbm.ecommerce` | 电商 | 服务类 |  | 5 | 商品主图 + 价格 + 卖点 + 双按钮 |
| 电商(新) | `com.hbm.ecommerce.v2` | 电商 | 服务类 |  | 5 | 支持图片或视频主图的电商卡片 |
| 电商(多商品) | `com.hbm.moreGoods` | 电商 | 服务类 |  | 5 | 店铺头部 + 多个商品列表 |
| 券+商品(竖版) | `com.hbm.ecommerceCoupon.vertical` | 电商 | 服务类 |  | 2 | 优惠券 + 竖向商品列表 |
| 券+商品(横版) | `com.hbm.ecommerceCoupon.horizontal` | 电商 | 服务类 |  | 2 | 优惠券 + 横向三列商品 |
| 红包 | `com.hbm.redpacket` | 电商 | 服务类 | ✓ | 7 | 红包封面：发送方名称 + 祝福语 + 领取按钮 |
| 个性化红包 | `com.hbm.redpacketAnimation.v2` | 电商 | 服务类 | ✓ | 5 | 支持动效与个性化参数的红包 |
| 单卡券 | `com.hbm.cardVoucher` | 电商 | 服务类 |  | 5 | 单张优惠券：面额、门槛、有效期、领取按钮 |
| 多卡券 | `com.hbm.cardVouchers` | 电商 | 服务类 |  | 5 | 多张优惠券列表，支持每张单独领取或底部统一按钮 |
| 一般通知类 | `com.hbm.notification` | 通知 | 通知类 | ✓ | 7 | 标题 + 描述 + 键值对信息 + 按钮，适合账单、物流、预约提醒 |
| 增强通知类 | `com.hbm.notificationPlus` | 通知 | 通知类 |  | 5 | 突出关键数值（金额、验证码等）的增强通知 |
| 火车票类 | `com.hbm.ticket.train` | 行程通知 | 通知类 |  | 5 | 车次、出发/到达站与时间、座位信息 |
| 汽车票类 | `com.hbm.ticket.bus` | 行程通知 | 通知类 |  | 5 | 班次、上车点、检票口等信息 |
| 机票类 | `com.hbm.ticket.flight` | 行程通知 | 通知类 |  | 5 | 航班、航站楼、登机口与座位信息 |
| 直飞 | `com.hbm.ticket.direct` | 行程通知 | 通知类 |  | 2 | 直飞航线行程与值机提醒 |
| 两层表单_4-1 | `com.hbm.form.41` | 问卷表单 | 服务类 |  | 2 | 4 个信息项 + 1 个提交按钮，用于预约、报名 |
| 两层表单_2-3 | `com.hbm.form.23` | 问卷表单 | 服务类 |  | 2 | 2 个填写项 + 3 个选择项的调研表单 |
| 文本单选 | `com.hbm.textSelect` | 单选表单 | 服务类 |  | 5 | 问题 + 文本选项，点击选项触发对应事件 |
| 图片单选 | `com.hbm.imgSelect` | 单选表单 | 服务类 |  | 5 | 问题 + 图片选项（横向滑动） |
| 自由版式 | `com.hbm.custom` | 自由版式 | 服务类 |  | 2 | 从空白画布开始，自由添加、拖拽与组合 32 种元素 |

<!-- ai-kit:generated:end -->
