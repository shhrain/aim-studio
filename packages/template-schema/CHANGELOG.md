# @aim/template-schema

## 0.1.0

### Minor Changes

- 0338ba3: 首个版本：

  - `@aim/template-schema`：模板协议、33 种版式与槽位限制、32 种元素、15 种点击事件、8 厂商矩阵与参数语法；
  - `@aim/template-core`：插件注册表、文档操作、预检规则与评分、AIM → RCS / RMS 转换（legacy / fixed 双模式）、扫码分享编码；
  - `@aim/template-preview`：容器单位缩放渲染器、厂商外壳与主题、多厂商 / 三信融合预览、iframe 嵌入与 Web Component；
  - `@aim/ui`：基于 shadcn/ui + Radix 的 PC 与移动端企业级组件；
  - `@aim/tailwind-config`：设计令牌（品牌色、圆角、阴影、暗色模式、安全区）与共享 PostCSS 配置；
  - `@aim/utils`、`@aim/api-client`：通用工具与类型化接口客户端（TanStack Query hooks）；
  - `@aim/ai-kit`：AI 编程助手提示词、Cursor 规则与示例模板。

### Patch Changes

- f196dfe: 补齐真实工作空间流程、稳定元素标识的 RCS 替代链接、分享素材引用与分页契约；修复草稿解析、非安全上下文 Mock 和公共样式依赖，完善冲突恢复、预检翻译及移动端嵌入兼容。

  私有包（`@aim/mock`、`@aim/i18n`、`@aim/api-contracts`、`@aim/db`）不参与版本发布，因此不写入 changeset，避免 Changesets 的“ignored / not ignored 混合”错误。
