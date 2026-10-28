import type { ExperienceApi } from './endpoints'
import type { Contact, ExperienceTemplate, SendRecord } from './contracts'
import { createHttpClient } from './http'
/** 将独立移动应用接入同源会话及显式工作空间。 */
export function createWorkspaceExperienceApi(workspace: () => string): ExperienceApi {
  const http = createHttpClient()
  const prefix = () => `/api/v1/workspaces/${encodeURIComponent(workspace())}`
  const all = async <T>(path: string) => {
    const result: T[] = []
    for (let page = 1; ; page++) {
      const response = await http.get<{ data: T[]; pageInfo?: { total: number } }>(path, {
        query: { page, size: 100 },
        raw: true,
      })
      result.push(...response.data)
      if (!response.pageInfo || result.length >= response.pageInfo.total) return result
    }
  }
  const list = () => all<ExperienceTemplate>(prefix() + '/experience/templates')
  const records = () => all<SendRecord>(prefix() + '/experience/records')
  const paginate = <T>(rows: T[], page: number, size: number) => ({
    records: rows.slice((page - 1) * size, page * size),
    total: rows.length,
    current: page,
    size,
    pages: Math.ceil(rows.length / size),
  })
  return {
    mockLogin: async () => {
      throw new Error('请使用邮箱账号登录')
    },
    imageCodeUrl: () => '',
    filterOptions: async () => {
      const rows = await list()
      return {
        industries: [...new Set(rows.map((r) => r.industryId).filter(Boolean))].map((id) => ({
          id,
          name: id,
        })),
        styles: [...new Set(rows.map((r) => r.cardId))].map((id) => ({
          id,
          name: id.split('.').at(-1)!,
        })),
        labels: [],
        carriers: [],
        factories: [],
      }
    },
    templateList: async (q) => {
      let rows = await list()
      if (q.keyword) rows = rows.filter((r) => r.tplName.includes(q.keyword!))
      if (q.industryIds?.length) rows = rows.filter((r) => q.industryIds!.includes(r.industryId))
      if (q.styleIds?.length) rows = rows.filter((r) => q.styleIds!.includes(r.cardId))
      if (q.factories?.length)
        rows = rows.filter((r) => r.factories.some((f) => q.factories!.includes(f)))
      return {
        subCode: 0,
        message: 'OK',
        data: rows.slice(q.pageIndex * q.pageSize, (q.pageIndex + 1) * q.pageSize),
        pageInfo: { total: rows.length, pageIndex: q.pageIndex, pageSize: q.pageSize },
      }
    },
    templateDetail: async (id) => {
      const row = (await list()).find((r) => r.tplId === id)
      if (!row) throw new Error('模板不存在或已下架')
      return row
    },
    sendPreview: async (body) => {
      const result = await http.post<{ mobiles: any[] }>(prefix() + '/ability/query', {
        source: body.phones.join(','),
      })
      return {
        items: result.mobiles.map((r) => ({
          ...r,
          sendable: true,
          messageType: 1,
          availableTypes: [1],
        })),
      }
    },
    sendExperience: async (body) => {
      const result = await http.post<{ id: string }>(
        prefix() + '/delivery-jobs',
        {
          templateId: body.tplId,
          mobiles: body.items.map((r) => r.mobile),
          sendMode: body.sendMode,
        },
        { headers: { 'Idempotency-Key': body.identity } },
      )
      return { requestId: result.id, status: 'ACCEPTED' }
    },
    sendDetail: async (q) => {
      let rows = await records()
      if (q.mobile) rows = rows.filter((r) => r.mobile.includes(q.mobile!))
      if (q.status) rows = rows.filter((r) => r.status === q.status)
      if (q.startDate) rows = rows.filter((r) => r.sendTime >= new Date(q.startDate!).getTime())
      if (q.endDate)
        rows = rows.filter((r) => r.sendTime < new Date(q.endDate!).getTime() + 86400000)
      return paginate(rows, q.pageNum, q.pageSize)
    },
    sendRecent: async () => ({
      mobiles: [...new Set((await records()).map((r) => r.mobile))].slice(0, 10),
    }),
    sendStatistics: async (q) => {
      let rows = (await records()).filter((r) => r.mode === 'simulated')
      if (q.startDate) rows = rows.filter((r) => r.sendTime >= new Date(q.startDate!).getTime())
      if (q.endDate)
        rows = rows.filter((r) => r.sendTime < new Date(q.endDate!).getTime() + 86400000)
      return {
        total: rows.length,
        byStatus: {
          SENDING: rows.filter((r) => r.status === 'SENDING').length,
          SUCCESS: rows.filter((r) => r.status === 'SUCCESS').length,
          FAILED: rows.filter((r) => r.status === 'FAILED').length,
        },
        byType: {
          1: rows.filter((r) => r.messageType === 1).length,
          2: rows.filter((r) => r.messageType === 2).length,
          3: rows.filter((r) => r.messageType === 3).length,
        },
        byFactory: [],
      }
    },
    wechatSignature: async () => {
      throw new Error('微信签名通道未配置')
    },
    abilityQuery: (source) => http.post(prefix() + '/ability/query', { source }),
    contacts: async (q) =>
      paginate(await all<Contact>(prefix() + '/contacts'), q.pageNum, q.pageSize),
    createContact: (body) => http.post(prefix() + '/contacts', body),
    updateContact: (id, body) => http.put(prefix() + `/contacts/${id}`, body),
    deleteContact: (id) => http.del(prefix() + `/contacts/${id}`),
  }
}
