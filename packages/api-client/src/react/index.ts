'use client'

import {
  QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { TemplateDocument } from '@aim/template-schema'
import type { SendRecordQuery, TemplateListQuery, TemplateQuery } from '../contracts'
import type { EditorApi, ExperienceApi } from '../endpoints'
import { ApiError } from '../http'

/** 统一的 QueryClient 默认值：登录失效不重试，其余最多 1 次 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          !(error instanceof ApiError && (error.isUnauthorized || error.subCode < 5000)) &&
          count < 1,
      },
      mutations: { retry: false },
    },
  })
}

export const queryKeys = {
  experience: {
    filters: ['experience', 'filters'] as const,
    list: (q: Omit<TemplateListQuery, 'pageIndex'>) => ['experience', 'list', q] as const,
    detail: (id: string) => ['experience', 'detail', id] as const,
    records: (q: Omit<SendRecordQuery, 'pageNum'>) => ['experience', 'records', q] as const,
    contacts: (whois: string) => ['experience', 'contacts', whois] as const,
    statistics: (whois: string, s?: string, e?: string) =>
      ['experience', 'statistics', whois, s, e] as const,
  },
  editor: {
    templates: (q: TemplateQuery) => ['editor', 'templates', q] as const,
    template: (id: string) => ['editor', 'template', id] as const,
    materials: (type?: string, keyword?: string) => ['editor', 'materials', type, keyword] as const,
    precheck: (taskId: string) => ['editor', 'precheck', taskId] as const,
  },
}

/* ------------------------------ 编辑器 ------------------------------ */

export function createEditorHooks(api: EditorApi, scope: () => string = () => '') {
  return {
    useTemplates: (q: TemplateQuery) =>
      useQuery({
        queryKey: [...queryKeys.editor.templates(q), scope()],
        queryFn: () => api.templates(q),
        placeholderData: keepPreviousData,
      }),
    useTemplate: (id: string | undefined) =>
      useQuery({
        queryKey: [...queryKeys.editor.template(id ?? ''), scope()],
        queryFn: () => api.template(id!),
        enabled: Boolean(id),
      }),
    useMaterials: (type?: 'image' | 'video' | 'audio', keyword?: string) =>
      useQuery({
        queryKey: [...queryKeys.editor.materials(type, keyword), scope()],
        queryFn: () => api.materials({ type, keyword }),
      }),
    useSaveTemplate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async ({ doc, isNew }: { doc: TemplateDocument; isNew?: boolean }) =>
          isNew ? api.createTemplate(doc) : api.saveTemplate(doc),
        onSuccess: (res) => {
          qc.setQueryData([...queryKeys.editor.template(res.id), scope()], res)
          void qc.invalidateQueries({ queryKey: ['editor', 'templates'] })
        },
      })
    },
    useDeleteTemplate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: api.deleteTemplate,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['editor', 'templates'] }),
      })
    },
    useDuplicateTemplate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: api.duplicateTemplate,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['editor', 'templates'] }),
      })
    },
    useUploadMaterial: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: api.uploadMaterial,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['editor', 'materials'] }),
      })
    },
    useDeepPrecheck: (taskId: string | undefined) =>
      useQuery({
        queryKey: [...queryKeys.editor.precheck(taskId ?? ''), scope()],
        queryFn: () => api.deepPrecheck(taskId!),
        enabled: Boolean(taskId),
        refetchIntervalInBackground: false,
        refetchInterval: (q) => (q.state.data?.status === 'running' ? 1000 : false),
      }),
  }
}

/* ------------------------------ 移动端 ------------------------------ */

export function createExperienceHooks(api: ExperienceApi, scope: () => string = () => '') {
  return {
    useFilterOptions: () =>
      useQuery({
        queryKey: [...queryKeys.experience.filters, scope()],
        queryFn: api.filterOptions,
        staleTime: 5 * 60_000,
      }),
    useTemplateDetail: (tplId: string | undefined) =>
      useQuery({
        queryKey: [...queryKeys.experience.detail(tplId ?? ''), scope()],
        queryFn: () => api.templateDetail(tplId!),
        enabled: Boolean(tplId),
      }),
    useContacts: (whois: string) =>
      useQuery({
        queryKey: queryKeys.experience.contacts(whois),
        queryFn: () => api.contacts({ whois, pageNum: 1, pageSize: 200 }),
        enabled: Boolean(whois),
      }),
    useStatistics: (whois: string, startDate?: string, endDate?: string) =>
      useQuery({
        queryKey: queryKeys.experience.statistics(whois, startDate, endDate),
        queryFn: () => api.sendStatistics({ whois, startDate, endDate }),
        enabled: Boolean(whois),
      }),
    useSaveContact: (whois: string) => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: ({
          id,
          contactName,
          mobile,
        }: {
          id?: string
          contactName: string
          mobile: string
        }) =>
          id
            ? api.updateContact(id, { whois, contactName, mobile })
            : api.createContact({ whois, contactName, mobile }),
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.experience.contacts(whois) }),
      })
    },
    useDeleteContacts: (whois: string) => {
      const qc = useQueryClient()
      return useMutation({
        // 逐个串行删除，保证部分失败时可定位
        mutationFn: async (ids: string[]) => {
          for (const id of ids) await api.deleteContact(id, whois)
        },
        onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.experience.contacts(whois) }),
      })
    },
  }
}
