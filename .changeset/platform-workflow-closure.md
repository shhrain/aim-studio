---
'@aim/template-schema': patch
'@aim/template-core': patch
'@aim/template-preview': patch
'@aim/api-client': patch
'@aim/ui': patch
---

补齐真实工作空间流程、稳定元素标识的 RCS 替代链接、分享素材引用与分页契约；修复草稿解析、非安全上下文 Mock 和公共样式依赖，完善冲突恢复、预检翻译及移动端嵌入兼容。

私有包（`@aim/mock`、`@aim/i18n`、`@aim/api-contracts`、`@aim/db`）不参与版本发布，因此不写入 changeset，避免 Changesets 的“ignored / not ignored 混合”错误。
