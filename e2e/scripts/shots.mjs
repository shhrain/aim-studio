/**
 * 页面巡检截图：node scripts/shots.mjs [editor|mobile|docs]...
 * 输出到 e2e/shots/（已忽略），用于 UI 走查。依赖已启动的 dev 服务。
 */
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const out = new URL('../shots/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
mkdirSync(out, { recursive: true })
const only = process.argv.slice(2)
const want = (k) => only.length === 0 || only.includes(k)

const browser = await chromium.launch()
const errors = []

async function ctx(opts) {
  const c = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ...opts })
  await c.addInitScript(() => localStorage.setItem('aim:editor-tour-v1', 'true'))
  return c
}

async function shot(page, name, { full = false, wait = 1200 } = {}) {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${out}${name}.png`, fullPage: full })
  console.log('  ✓', name)
}

function watch(page, tag) {
  page.on('pageerror', (e) => errors.push(`[${tag}] ${e.message.slice(0, 200)}`))
  page.on(
    'console',
    (m) => m.type() === 'error' && errors.push(`[${tag}] ${m.text().slice(0, 200)}`),
  )
}

if (want('editor')) {
  console.log('editor')
  const c = await ctx({ viewport: { width: 1440, height: 900 } })
  const p = await c.newPage()
  watch(p, 'editor')
  const E = 'http://localhost:3000'
  await p.goto(`${E}/templates`)
  await p.locator('article').first().waitFor()
  await shot(p, 'editor-01-templates')
  await p.goto(`${E}/editor/new`)
  await shot(p, 'editor-02-new')
  await p.locator('button', { hasText: '大图 + 标题 + 描述 + 按钮' }).click()
  await shot(p, 'editor-03-workspace')
  await p.locator('.aim-el[data-selectable][data-slot="title"]').click()
  await shot(p, 'editor-04-selected')
  await p.getByRole('button', { name: '元素', exact: true }).click()
  await shot(p, 'editor-05-elements')
  await p.getByRole('button', { name: '参数', exact: true }).click()
  await shot(p, 'editor-06-params')
  await p.getByRole('button', { name: '预览', exact: true }).click()
  await shot(p, 'editor-07-preview', { wait: 2000 })
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: '提交审核' }).first().click()
  await shot(p, 'editor-08-review', { wait: 2500 })
  await p.keyboard.press('Escape')
  await p.goto(`${E}/editor/tpl_travel`)
  await shot(p, 'editor-09-existing', { wait: 2500 })
  await p.goto(`${E}/gallery`)
  await shot(p, 'editor-10-gallery', { wait: 2500 })
  await c.close()
}

if (want('mobile')) {
  console.log('mobile')
  const c = await ctx({ ...devices['Pixel 7'] })
  const p = await c.newPage()
  watch(p, 'mobile')
  const M = 'http://localhost:3001'
  await p.goto(`${M}/auth-required`)
  await shot(p, 'mobile-01-auth')
  await p.goto(`${M}/?token=shots&phone=13800138000`)
  await p.waitForURL(/template-list/)
  await p.locator('.waterfall > a').first().waitFor()
  await shot(p, 'mobile-02-list', { wait: 2000 })
  await shot(p, 'mobile-02-list-full', { full: true, wait: 200 })
  await p.goto(`${M}/detail?tplId=tpl_travel`)
  await shot(p, 'mobile-03-detail', { wait: 2000 })
  await shot(p, 'mobile-03-detail-full', { full: true, wait: 200 })
  await p.getByRole('button', { name: '测试发送' }).click()
  await shot(p, 'mobile-04-send')
  await p.goto(`${M}/send-records`)
  await shot(p, 'mobile-05-records', { wait: 2000 })
  await p.goto(`${M}/send-records/statistics`)
  await shot(p, 'mobile-06-statistics', { wait: 2000 })
  await p.goto(`${M}/send-objects`)
  await shot(p, 'mobile-07-objects', { wait: 2000 })
  await p.goto(`${M}/ability-query`)
  await shot(p, 'mobile-08-ability', { wait: 1500 })
  await p.goto(`${M}/ability-guide`)
  await shot(p, 'mobile-09-guide', { wait: 1500 })
  await p.goto(`${M}/scan-experience`)
  await shot(p, 'mobile-10-scan', { wait: 1500 })
  await c.close()
}

if (want('docs')) {
  console.log('docs')
  const c = await ctx({ viewport: { width: 1440, height: 900 } })
  const p = await c.newPage()
  watch(p, 'docs')
  const D = 'http://localhost:3002'
  await p.goto(`${D}/`)
  await shot(p, 'docs-01-home', { wait: 2000 })
  await shot(p, 'docs-01-home-full', { full: true, wait: 200 })
  await p.goto(`${D}/docs`)
  await shot(p, 'docs-02-index', { wait: 2000 })
  await p.goto(`${D}/docs/spec/layouts`)
  await shot(p, 'docs-03-layouts', { wait: 3000 })
  await p.goto(`${D}/docs/sdk`)
  await shot(p, 'docs-04-sdk', { wait: 2000 })
  await c.close()
}

await browser.close()
if (errors.length) console.log('\n页面错误：\n' + [...new Set(errors)].join('\n'))
