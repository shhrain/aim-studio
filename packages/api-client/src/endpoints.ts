import type { TemplateDocument } from '@aim/template-schema'
import type {
  AbilityResult,
  AiCopyRequest,
  AiCopyResult,
  Contact,
  DeepPrecheckTask,
  ExperienceTemplate,
  FeedbackBody,
  FilterOptions,
  LinkCheckResult,
  Material,
  MaterialType,
  MockLoginResult,
  PageResult,
  SendExperienceBody,
  SendPreviewItem,
  SendRecord,
  SendRecordQuery,
  SendStatistics,
  SubmitTemplateBody,
  TemplateListQuery,
  TemplateQuery,
  TemplateSummary,
  UploadMaterialBody,
  WechatSignature,
} from './contracts'
import { EDITOR_PREFIX, EXPERIENCE_PREFIX } from './contracts'
import type { ApiResponse, HttpClient } from './http'

/** 移动端体验接口 */
export function createExperienceApi(http: HttpClient) {
  const p = EXPERIENCE_PREFIX
  return {
    imageCodeUrl: (identity: string) => http.url(`${p}/auth/image-code`, { identity, t: Date.now() }),
    mockLogin: (phone: string) => http.post<MockLoginResult>(`${p}/auth/mock-login`, { phone }),
    filterOptions: () => http.post<FilterOptions>(`${p}/template/filter-options`, {}),
    templateList: (query: TemplateListQuery) =>
      http.post<ApiResponse<ExperienceTemplate[]>>(`${p}/template/list`, query, { raw: true }),
    templateDetail: (tplId: string) => http.post<ExperienceTemplate>(`${p}/template/detail`, { tplId }),
    sendPreview: (body: { whois: string; tplId: string; phones: string[] }) =>
      http.post<{ items: SendPreviewItem[] }>(`${p}/send/preview`, body),
    sendExperience: (body: SendExperienceBody) =>
      http.post<{ requestId: string; status: 'ACCEPTED' }>(`${p}/send/experience`, body, { silent: true }),
    sendDetail: (query: SendRecordQuery) => http.post<PageResult<SendRecord>>(`${p}/send/detail`, query),
    sendRecent: (whois: string) => http.post<{ mobiles: string[] }>(`${p}/send/recent`, { whois }),
    sendStatistics: (query: { whois: string; startDate?: string; endDate?: string }) =>
      http.post<SendStatistics>(`${p}/send/statistics`, query),
    wechatSignature: (url: string) => http.post<WechatSignature>(`${p}/wechat/signature`, { url }, { silent: true }),
    abilityQuery: (source: string) => http.post<{ mobiles: AbilityResult[] }>(`${p}/ability/query`, { source }),
    contacts: (query: { whois: string; pageNum: number; pageSize: number }) =>
      http.get<PageResult<Contact>>(`${p}/contacts/page`, { query }),
    createContact: (body: { whois: string; contactName: string; mobile: string }) =>
      http.post<Contact>(`${p}/contacts`, body, { silent: true }),
    updateContact: (id: string, body: { whois: string; contactName: string; mobile: string }) =>
      http.put<Contact>(`${p}/contacts/${id}`, body, { silent: true }),
    deleteContact: (id: string, whois: string) => http.del<null>(`${p}/contacts/${id}`, { query: { whois } }),
  }
}

/** 编辑器接口 */
export function createEditorApi(http: HttpClient) {
  const p = EDITOR_PREFIX
  return {
    templates: (query: TemplateQuery = {}) => http.get<ApiResponse<TemplateSummary[]>>(`${p}/templates`, { query: query as never, raw: true }),
    template: (id: string) => http.get<TemplateSummary>(`${p}/templates/${id}`),
    createTemplate: (document: TemplateDocument) => http.post<TemplateSummary>(`${p}/templates`, document),
    saveTemplate: (document: TemplateDocument) => http.put<TemplateSummary>(`${p}/templates/${document.id}`, document),
    deleteTemplate: (id: string) => http.del<null>(`${p}/templates/${id}`),
    duplicateTemplate: (id: string) => http.post<TemplateSummary>(`${p}/templates/${id}/duplicate`),
    submitTemplate: (id: string, body: SubmitTemplateBody) => http.post<TemplateSummary>(`${p}/templates/${id}/submit`, body),
    materials: (query: { type?: MaterialType; keyword?: string } = {}) => http.get<Material[]>(`${p}/materials`, { query }),
    uploadMaterial: (body: UploadMaterialBody) => http.post<Material>(`${p}/materials`, body),
    deleteMaterial: (id: string) => http.del<null>(`${p}/materials/${id}`),
    startDeepPrecheck: (document: TemplateDocument) => http.post<DeepPrecheckTask>(`${p}/precheck/deep`, { document }),
    deepPrecheck: (taskId: string) => http.get<DeepPrecheckTask>(`${p}/precheck/deep/${taskId}`),
    checkLink: (url: string) => http.post<LinkCheckResult>(`${p}/tools/link-check`, { url }),
    aiCopywriting: (body: AiCopyRequest) => http.post<AiCopyResult>(`${p}/ai/copywriting`, body),
    feedback: (body: FeedbackBody) => http.post<{ id: string }>(`${p}/feedback`, body),
  }
}

export type ExperienceApi = ReturnType<typeof createExperienceApi>
export type EditorApi = ReturnType<typeof createEditorApi>
