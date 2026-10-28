import { expect, test } from '@playwright/test'

/**
 * 视觉回归：版式画廊中的关键版式。
 * 基准图按平台区分（字体渲染不同），新平台首次运行：pnpm test:e2e:update
 * 默认跳过，避免没有本平台基线的 CI 红；需要时 PW_VISUAL=1 pnpm test:e2e。
 */
test.skip(process.env.PW_VISUAL !== '1', '设置 PW_VISUAL=1 运行视觉回归（基线按平台生成）')
const LAYOUTS = [
  'com.hbm.imageandtext',
  'com.hbm.carouselImageSixteenToNine',
  'com.hbm.notification',
  'com.hbm.redpacket',
  'com.hbm.ecommerce',
  'com.hbm.cardVouchers',
  'com.hbm.ticket.flight',
  'com.hbm.form.41',
  'com.hbm.sideslip',
  'com.hbm.video',
  'com.hbm.custom',
]

test.describe('视觉回归', () => {
  for (const vendor of ['huawei', 'xiaomi', 'vivo']) {
    test(`版式画廊 · ${vendor}`, async ({ page }) => {
      await page.goto('/gallery')
      await page.getByRole('combobox', { name: '厂商' }).click()
      await page
        .getByRole('option', { name: { huawei: '华为', xiaomi: '小米', vivo: 'vivo' }[vendor]! })
        .click()
      for (const id of LAYOUTS) {
        const item = page.getByTestId(`gallery-${id}`)
        await item.scrollIntoViewIfNeeded()
        await expect(item.locator('.aim-phone')).toHaveScreenshot(`${vendor}-${id}.png`)
      }
    })
  }
  for (const protocol of ['rcs', 'rms'] as const) {
    test(`三信转换 · ${protocol}`, async ({ page }) => {
      await page.goto('/gallery')
      await page
        .getByRole('radio', { name: protocol === 'rcs' ? '苹果' : '其他', exact: true })
        .click()
      for (const id of ['com.hbm.imageandtext', 'com.hbm.video', 'com.hbm.redpacket']) {
        const item = page.getByTestId(`gallery-${id}`)
        await item.scrollIntoViewIfNeeded()
        await expect(item.locator('.aim-phone')).toHaveScreenshot(`${protocol}-${id}.png`)
      }
    })
  }
})
