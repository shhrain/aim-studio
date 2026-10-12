/**
 * pnpm ai:generate
 * 根据 template-schema 生成：PROMPT.md、AGENTS.md 区块、.cursor/rules、文档站规范章节、示例模板 JSON。
 */
import { buildSampleTemplates } from '@aim/mock/fixtures'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAgentsSection } from './agents'
import { buildSpecDocs } from './docs'
import { buildPrompt } from './prompt'
import { buildCursorRules } from './rules'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = join(here, '..')
const root = join(pkg, '..', '..')

function write(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content.replace(/\r\n/g, '\n'), 'utf8')
  console.log(`  ✓ ${file.replace(root, '').replace(/\\/g, '/')}`)
}

/**
 * 示例中的 data URI 图片替换为短链接，保持提示词精简；
 * 随机生成的页面 / 元素 ID 按出现顺序重编号，保证多次生成结果一致。
 */
function compact(value: unknown): unknown {
  const ids = new Map<string, string>()
  const counters: Record<string, number> = {}
  return JSON.parse(JSON.stringify(value), (_k, v) => {
    if (typeof v !== 'string') return v
    if (v.startsWith('data:image')) return 'https://cdn.example.com/sample.png'
    const m = /^(page|el)_[a-z0-9]{10}$/.exec(v)
    if (!m) return v
    if (!ids.has(v)) {
      const n = (counters[m[1]!] = (counters[m[1]!] ?? 0) + 1)
      ids.set(v, `${m[1]}_${String(n).padStart(2, '0')}`)
    }
    return ids.get(v)
  })
}

const samples = buildSampleTemplates(Date.UTC(2026, 9, 12))
const imageText = samples.find((s) => s.document.layoutId === 'com.hbm.imageandtext')!.document
const exampleJson = JSON.stringify(compact(imageText), null, 2)

console.log('生成 AI 知识包…')
write(join(pkg, 'PROMPT.md'), buildPrompt(exampleJson))

for (const s of samples)
  write(
    join(pkg, 'examples', `${s.document.id}.json`),
    `${JSON.stringify(compact(s.document), null, 2)}\n`,
  )

for (const [name, content] of Object.entries(buildCursorRules()))
  write(join(root, '.cursor', 'rules', name), content)

const agentsFile = join(root, 'AGENTS.md')
const agents = readFileSync(agentsFile, 'utf8')
write(
  agentsFile,
  agents.replace(
    /<!-- ai-kit:generated:start -->[\s\S]*<!-- ai-kit:generated:end -->/,
    buildAgentsSection(),
  ),
)

const specDir = join(root, 'apps', 'docs', 'content', 'docs', 'spec')
for (const [name, content] of Object.entries(buildSpecDocs())) write(join(specDir, name), content)

console.log('完成。')
