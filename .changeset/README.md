# Changesets

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理 `packages/*` 的版本与 CHANGELOG。

- 修改了可发布的包（`@aim/template-*`、`@aim/ui`、`@aim/api-client` 等）后执行 `pnpm changeset`，选择包与语义化版本级别并写明变更。
- `pnpm version-packages` 消费 changeset，更新版本号与 CHANGELOG。
- `pnpm release` 构建并发布。
- `apps/*` 为私有应用，不参与发版（见 `config.json` 的 `ignore`）。

`@aim/template-schema`、`@aim/template-core`、`@aim/template-preview` 为 linked 组：三者版本协同升级，保证模板协议一致。
