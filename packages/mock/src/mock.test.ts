import { createEditorApi, createExperienceApi, createHttpClient, type ApiError } from '@aim/api-client'
import { createDocument, precheck } from '@aim/template-core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildSampleTemplates } from './fixtures'
import { createMockServer } from './node'

const server = createMockServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const base = 'http://mock.local'

describe('示例模板', () => {
  it('全部通过结构与快速预检（除参数示例外无错误）', () => {
    for (const s of buildSampleTemplates()) {
      const report = precheck(s.document)
      const errors = report.errors.filter((e) => !['slot.placeholder'].includes(e.code))
      expect(errors, `${s.document.name}: ${errors.map((e) => e.message).join('；')}`).toEqual([])
    }
  })
})

describe('体验接口 Mock', () => {
  let token = ''
  const http = createHttpClient({ baseUrl: base, getToken: () => token })
  const api = createExperienceApi(http)

  it('未登录返回 9001', async () => {
    await expect(api.filterOptions()).rejects.toMatchObject({ subCode: 9001 })
  })

  it('登录 → 列表 → 详情 → 发送预览 → 发送 → 记录', async () => {
    const login = await api.mockLogin('13800138000')
    token = login.token
    const list = await api.templateList({ pageIndex: 0, pageSize: 6 })
    expect(list.data.length).toBe(6)
    expect(list.pageInfo?.total).toBeGreaterThan(6)
    const detail = await api.templateDetail(list.data[0]!.tplId)
    expect(detail.document.pages.length).toBe(1)
    const preview = await api.sendPreview({ whois: login.phone, tplId: detail.tplId, phones: ['13800138000', '13912345678'] })
    expect(preview.items).toHaveLength(2)
    await expect(
      api.sendExperience({ whois: login.phone, tplId: detail.tplId, sendMode: 'priority', items: [{ mobile: '13800138000' }], imgCode: '0000', identity: 'x' }),
    ).rejects.toMatchObject({ subCode: 1002 } satisfies Partial<ApiError>)
  })

  it('通讯录增删改与重复校验', async () => {
    const c = await api.createContact({ whois: '13800138000', contactName: '张三', mobile: '13700001111' })
    await expect(api.createContact({ whois: '13800138000', contactName: '张三2', mobile: '13700001111' })).rejects.toMatchObject({ subCode: 2002 })
    await api.updateContact(c.id, { whois: '13800138000', contactName: '张三丰', mobile: '13700001111' })
    const page = await api.contacts({ whois: '13800138000', pageNum: 1, pageSize: 10 })
    expect(page.records[0]!.contactName).toBe('张三丰')
    await api.deleteContact(c.id, '13800138000')
    expect((await api.contacts({ whois: '13800138000', pageNum: 1, pageSize: 10 })).total).toBe(0)
  })
})

describe('编辑器接口 Mock', () => {
  const api = createEditorApi(createHttpClient({ baseUrl: base }))

  it('模板 CRUD 与复制', async () => {
    const res = await api.templates({})
    expect(res.data.length).toBeGreaterThan(5)
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '新建测试' })
    const created = await api.createTemplate(doc)
    expect(created.status).toBe('draft')
    const copy = await api.duplicateTemplate(doc.id)
    expect(copy.name).toBe('新建测试-副本')
    await api.deleteTemplate(copy.id)
  })

  it('未通过预检的模板无法提交', async () => {
    const doc = createDocument({ layoutId: 'com.hbm.imageandtext', name: '' })
    await expect(api.submitTemplate(doc.id, { document: doc, precheckPassed: false })).rejects.toMatchObject({ subCode: 1001 })
  })

  it('AI 文案按字数截断', async () => {
    const { candidates } = await api.aiCopywriting({ field: 'title', layoutName: '图文', maxLength: 10, prompt: '国庆出游' })
    expect(candidates.length).toBeGreaterThan(0)
    for (const c of candidates) expect([...c].length).toBeLessThanOrEqual(10)
  })
})
