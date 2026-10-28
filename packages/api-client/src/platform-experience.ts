import type { ExperienceApi } from './endpoints'
import type { Contact, ExperienceTemplate, SendRecord } from './contracts'
import { createHttpClient } from './http'
const csv = (value?: string[]) => (value?.length ? value.join(',') : undefined)
const pages = (total: number, size: number) => Math.max(1, Math.ceil(total / size))
/** 将独立移动应用接入同源会话及显式工作空间。 */
export function createWorkspaceExperienceApi(workspace: () => string): ExperienceApi {
  const http = createHttpClient()
  const prefix = () => `/api/v1/workspaces/${encodeURIComponent(workspace())}`
  const paginate = <T>(rows: T[], page: number, size: number, total: number) => ({
    records: rows,
    total,
    current: page,
    size,
    pages: pages(total, size),
  })
  return {
    mockLogin: async () => {
      throw new Error('请使用邮箱账号登录')
    },
    imageCodeUrl: () => '',
    filterOptions: () => http.get(prefix() + '/experience/filter-options'),
    templateList: async (q) => {
      const page = q.pageIndex + 1
      const response = await http.get<{ data: ExperienceTemplate[]; pageInfo: { total: number } }>(
        prefix() + '/experience/templates',
        {
          query: {
            page,
            size: q.pageSize,
            keyword: q.keyword,
            styleIds: csv(q.styleIds),
            industryIds: csv(q.industryIds),
            factories: csv(q.factories),
            integrated: q.integrated ? 'true' : undefined,
          },
          raw: true,
        },
      )
      return {
        subCode: 0,
        message: 'OK',
        data: response.data,
        pageInfo: { total: response.pageInfo.total, pageIndex: q.pageIndex, pageSize: q.pageSize },
      }
    },
    templateDetail: (id) => http.get<ExperienceTemplate>(prefix() + `/experience/templates/${id}`),
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
      const response = await http.get<{ data: SendRecord[]; pageInfo: { total: number } }>(
        prefix() + '/experience/records',
        {
          query: {
            page: q.pageNum,
            size: q.pageSize,
            mobile: q.mobile,
            status: q.status,
            startDate: q.startDate,
            endDate: q.endDate,
          },
          raw: true,
        },
      )
      return paginate(response.data, q.pageNum, q.pageSize, response.pageInfo.total)
    },
    sendRecent: () => http.get<{ mobiles: string[] }>(prefix() + '/experience/recent-mobiles'),
    sendStatistics: (q) =>
      http.get(prefix() + '/experience/statistics', {
        query: { startDate: q.startDate, endDate: q.endDate },
      }),
    wechatSignature: async () => {
      throw new Error('微信签名通道未配置')
    },
    abilityQuery: (source) => http.post(prefix() + '/ability/query', { source }),
    contacts: async (q) => {
      const size = Math.min(100, q.pageSize)
      const rows: Contact[] = []
      let total = 0
      for (let page = q.pageNum; rows.length < q.pageSize; page++) {
        const response = await http.get<{ data: Contact[]; pageInfo: { total: number } }>(
          prefix() + '/contacts',
          { query: { page, size }, raw: true },
        )
        rows.push(...response.data)
        total = response.pageInfo.total
        if (!response.data.length || rows.length >= total) break
      }
      return paginate(rows, q.pageNum, q.pageSize, total)
    },
    createContact: (body) => http.post(prefix() + '/contacts', body),
    updateContact: (id, body) => http.put(prefix() + `/contacts/${id}`, body),
    deleteContact: (id) => http.del(prefix() + `/contacts/${id}`),
  }
}
