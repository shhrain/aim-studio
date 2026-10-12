import { expect, test } from '@playwright/test'

test('扫码预览：分享接口 + 预览页', async ({ page, request }) => {
  // 构造一个最小合法模板（结构与编辑器导出一致）
  const now = Date.now()
  const document = {
    schemaVersion: 1,
    id: 'tpl_share_e2e',
    name: '分享测试',
    usage: 'commercial',
    category: 'service',
    layoutId: 'com.hbm.pureText',
    cardId: 'com.hbm.pureText',
    vendors: ['huawei', 'vivo'],
    recognition: 'shortLink',
    params: [],
    settings: {},
    pages: [
      {
        id: 'p1',
        mode: 'flow',
        style: { height: 200, backgroundColor: '#FFFFFF', borderRadius: 12 },
        elements: [
          {
            id: 'e1',
            type: 'text',
            slot: 'title',
            x: 14,
            y: 14,
            w: 314,
            h: 26,
            z: 0,
            angle: 0,
            visible: true,
            locked: false,
            style: { fontSize: 17, fontWeight: 600 },
            props: { text: '扫码预览标题' },
          },
          {
            id: 'e2',
            type: 'text',
            slot: 'description',
            x: 14,
            y: 48,
            w: 314,
            h: 60,
            z: 1,
            angle: 0,
            visible: true,
            locked: false,
            style: { fontSize: 13 },
            props: { text: '这是一段通过二维码分享到手机的模板内容。' },
          },
        ],
      },
    ],
    meta: { status: 'draft', createdAt: now, updatedAt: now },
  }
  const res = await request.post('/api/share', { data: { document, vendor: 'vivo' } })
  expect(res.ok()).toBeTruthy()
  const { id } = (await res.json()) as { id: string }

  await page.goto(`/preview/${id}`)
  await expect(page.getByRole('heading', { name: '分享测试' })).toBeVisible()
  await expect(page.getByText('扫码预览标题')).toBeVisible()
  await expect(page.locator('.aim-root[data-vendor="vivo"]')).toBeVisible()

  await page.goto('/preview/not-exist')
  await expect(page.getByText(/二维码已过期/)).toBeVisible()
})
