import { login } from '../helpers/platform'
import { expect, test, type Locator, type Page } from '@playwright/test'

/** 桌面端（鼠标）滚动交互：滚轮横滑、拖拽滚动、弹窗 / 面板纵向滚动 */

const scrollLeft = (l: Locator) => l.evaluate((el) => el.scrollLeft)
const scrollTop = (l: Locator) => l.evaluate((el) => el.scrollTop)

async function wheelOver(page: Page, target: Locator, dy: number) {
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, dy)
}

async function dragOver(page: Page, target: Locator, dx: number) {
  const box = (await target.boundingBox())!
  const y = box.y + box.height / 2
  const x = box.x + box.width * (dx < 0 ? 0.7 : 0.3)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y)
  await page.mouse.up()
}

let workspace = ''
test.beforeEach(async ({ page }) => {
  workspace = (await login(page)).workspace
  await page.addInitScript(() => localStorage.setItem('aim:editor-tour-v1', 'true'))
})

test('横滑模板：画布内滚轮与鼠标拖拽可横向滑动，拖拽不误选中', async ({ page }) => {
  await page.goto(`/zh-CN/app/w/${workspace}/create/new?layout=com.hbm.sideslip`)
  const row = page.locator('.aim-el[data-selectable] .aim-hscroll')
  await expect(row).toBeVisible()

  await wheelOver(page, row, 120)
  await expect.poll(() => scrollLeft(row)).toBeGreaterThan(50)

  // 默认 2 张卡片，滚轮已到末尾；向右拖拽回到开头
  await dragOver(page, row, 160)
  await expect.poll(() => scrollLeft(row)).toBeLessThan(5)
  // 拖拽结束不应触发选中，检查器仍显示模板设置
  await expect(page.getByText('模板设置')).toBeVisible()

  // 单击仍可选中
  await row.click()
  await expect(page.getByRole('tab', { name: '内容' })).toBeVisible()
})

test('图片轮播：鼠标拖拽翻页', async ({ page }) => {
  await page.goto(`/zh-CN/app/w/${workspace}/create/new?layout=com.hbm.carouselImageSixteenToNine`)
  const swiper = page.locator('.aim-el[data-selectable] .aim-swiper')
  const track = swiper.locator('.aim-swiper-track')
  await expect(track).toHaveAttribute('style', /translateX\(-?0%\)/)
  await dragOver(page, swiper, -120)
  await expect(track).toHaveAttribute('style', /translateX\(-100%\)/)
  await expect(page.getByText('模板设置')).toBeVisible()
})

test('检查器与预览弹窗可用滚轮纵向滚动', async ({ page }) => {
  await page.goto(`/zh-CN/app/w/${workspace}/create/new?layout=com.hbm.sideslip`)
  await page.locator('.aim-el[data-selectable][data-type="sideslip"]').click()
  const viewport = page.locator('aside [data-slot="scroll-area-viewport"]').last()
  await wheelOver(page, viewport, 600)
  await expect.poll(() => scrollTop(viewport)).toBeGreaterThan(100)

  await page.getByRole('button', { name: '预览', exact: true }).click()
  const body = page.locator('[data-slot="dialog-body"]')
  await expect(page.getByText('华为手机')).toBeVisible()
  await wheelOver(page, body, 800)
  await expect.poll(() => scrollTop(body)).toBeGreaterThan(100)
})

test('移动端厂商行在桌面浏览器中可滚轮横滑', async ({ page }) => {
  const state = await login(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/m/detail?tplId=' + state.template + '&workspace=' + state.workspace)
  const row = page.locator('[data-slot="scroll-row"] > div').first()
  await expect(row).toBeVisible()
  await wheelOver(page, row, 200)
  await expect.poll(() => scrollLeft(row)).toBeGreaterThan(0)
})
