# @aim/utils

## 0.1.0

### Minor Changes

- f7f2f93: 桌面端滚动交互：

  - `@aim/utils`：新增 `enableDragScroll`，为横向滚动容器提供鼠标拖拽、滚轮横滑（开启 scroll-snap 时按项翻动）与拖拽后防误触；
  - `@aim/ui`：新增 `ScrollRow` 横向滚动行组件（两端渐隐、悬停翻页按钮）；
  - `@aim/template-preview`：横滑卡片、图片单选、5G 消息多卡片支持鼠标拖拽与滚轮；轮播支持鼠标拖拽与触控板横滑翻页。

- 0338ba3: 首个版本：

  - `@aim/template-schema`：模板协议、33 种版式与槽位限制、32 种元素、15 种点击事件、8 厂商矩阵与参数语法；
  - `@aim/template-core`：插件注册表、文档操作、预检规则与评分、AIM → RCS / RMS 转换（legacy / fixed 双模式）、扫码分享编码；
  - `@aim/template-preview`：容器单位缩放渲染器、厂商外壳与主题、多厂商 / 三信融合预览、iframe 嵌入与 Web Component；
  - `@aim/ui`：基于 shadcn/ui + Radix 的 PC 与移动端企业级组件；
  - `@aim/tailwind-config`：设计令牌（品牌色、圆角、阴影、暗色模式、安全区）与共享 PostCSS 配置；
  - `@aim/utils`、`@aim/api-client`：通用工具与类型化接口客户端（TanStack Query hooks）；
  - `@aim/ai-kit`：AI 编程助手提示词、Cursor 规则与示例模板。
