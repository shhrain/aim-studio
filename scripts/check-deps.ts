/**
 * 依赖规范检查：
 * 1. 内部包必须使用 workspace:* 引用
 * 2. 外部依赖必须使用 catalog: 统一版本（白名单除外）
 * 用法：pnpm check:deps
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const GROUPS = ['apps', 'packages', 'tooling']
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'] as const
const ALLOW_NON_CATALOG = new Set(['rimraf'])

type Pkg = { name: string } & Partial<Record<(typeof SECTIONS)[number], Record<string, string>>>

const manifests: { dir: string; pkg: Pkg }[] = []
for (const group of GROUPS) {
  const base = join(ROOT, group)
  if (!existsSync(base)) continue
  for (const dir of readdirSync(base)) {
    const file = join(base, dir, 'package.json')
    if (existsSync(file))
      manifests.push({ dir: `${group}/${dir}`, pkg: JSON.parse(readFileSync(file, 'utf8')) })
  }
}

const internal = new Set(manifests.map((m) => m.pkg.name))
const problems: string[] = []

for (const { dir, pkg } of manifests) {
  for (const section of SECTIONS) {
    if (section === 'peerDependencies') continue
    for (const [name, range] of Object.entries(pkg[section] ?? {})) {
      if (internal.has(name)) {
        if (!range.startsWith('workspace:'))
          problems.push(`${dir}: ${name} 应使用 workspace:*（当前 ${range}）`)
      } else if (range !== 'catalog:' && !ALLOW_NON_CATALOG.has(name)) {
        problems.push(`${dir}: ${name} 应使用 catalog:（当前 ${range}）`)
      }
    }
  }
}

if (problems.length) {
  console.error(`依赖规范检查失败（${problems.length}）：\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(`依赖规范检查通过：${manifests.length} 个包`)
