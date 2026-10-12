import { existsSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * 视觉回归：版式画廊中的关键版式。
 * 基准图按平台区分（字体渲染不同），新平台首次运行：pnpm test:e2e:update
 */
const LAYOUTS = [
  'com.hbm.imageandtext',
  'com.hbm.carouselImageSixteenToNine',
  'com.hbm.notification',
  'com.hbm.redpacket',
  'com.hbm.ecommerce',
  'com.hbm.cardVouchers',
  'com.hbm.ticket.flight',
  'com.hbm.form.41',
]

test.describe('视觉回归', () => {
  test.beforeEach(({}, info) => {
    const updating =
      info.config.updateSnapshots === 'all' || info.config.updateSnapshots === 'changed'
    const baseline = info.snapshotPath(`huawei-${LAYOUTS[0]}.png`, { kind: 'screenshot' })
    test.skip(
      !updating && !existsSync(baseline),
      `当前平台（${process.platform}）尚无视觉基准，请先运行 pnpm test:e2e:update`,
    )
  })

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
})
