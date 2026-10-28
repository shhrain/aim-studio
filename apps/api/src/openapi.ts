import { z } from 'zod'
import {
  contactSchema,
  deliverySchema,
  preferencesSchema,
  workspaceSchema,
  submitSchema,
  pageSchema,
  roles,
  API_CODE,
} from '@aim/api-contracts'
import { templateDocumentSchema } from '@aim/template-schema'
const json = (schema: z.ZodType) => z.toJSONSchema(schema)
const version = z.object({
  id: z.string(),
  revision: z.number().int(),
  status: z.string(),
  document: templateDocumentSchema,
  converted: z.unknown(),
  created_at: z.string(),
})
const task = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'done', 'failed']),
  mode: z.string(),
  result: z.unknown().optional(),
  error: z.string().nullable().optional(),
})
const schemas: Record<string, unknown> = {
  Error: {
    type: 'object',
    required: ['subCode', 'message', 'data'],
    properties: {
      subCode: { type: 'integer', enum: Object.values(API_CODE) },
      message: { type: 'string' },
      data: { type: 'null' },
      requestId: { type: 'string' },
      fieldErrors: {
        type: 'object',
        additionalProperties: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  TemplateDocument: json(templateDocumentSchema),
  Version: json(version),
  Task: json(task),
  PageInfo: {
    type: 'object',
    required: ['page', 'size', 'total'],
    properties: {
      page: { type: 'integer', minimum: 1 },
      size: { type: 'integer', minimum: 1, maximum: 100 },
      total: { type: 'integer', minimum: 0 },
    },
  },
}
function bodyFor(path: string, method: string): z.ZodType | undefined {
  if (!['POST', 'PUT'].includes(method)) return
  if (path.endsWith('/submit')) return submitSchema
  if (path.endsWith('/decision'))
    return z.object({
      decision: z.enum(['approved', 'rejected', 'withdrawn']),
      reason: z.string().max(1000).optional(),
    })
  if (path.endsWith('/publish')) return z.object({ versionId: z.string().nullable() })
  if (path.endsWith('/archive')) return z.object({ archived: z.boolean() })
  if (path.endsWith('/team/invite'))
    return z.object({ email: z.email(), role: z.enum(['admin', 'editor', 'reviewer', 'viewer']) })
  if (/\/team\/:id$/.test(path))
    return z.object({
      role: z.enum(roles).optional(),
      remove: z.boolean().optional(),
      transfer: z.boolean().optional(),
    })
  if (path.endsWith('/contacts') || /\/contacts\/:id$/.test(path)) return contactSchema
  if (path.endsWith('/delivery-jobs')) return deliverySchema
  if (path.endsWith('/preferences')) return preferencesSchema
  if (path === '/api/v1/workspaces' || path.endsWith('/settings')) return workspaceSchema
  if (path.endsWith('/shares')) return z.object({ templateId: z.string() })
  if (path.endsWith('/precheck/deep')) return z.object({ document: templateDocumentSchema })
  if (path.endsWith('/ability/query')) return z.object({ source: z.string().max(1000) })
  if (path.endsWith('/tools/link-check')) return z.object({ url: z.url() })
  if (path.endsWith('/ai/copywriting'))
    return z.object({
      prompt: z.string().min(1).max(1000),
      maxLength: z.number().int().min(1).max(1000),
    })
  if (path.endsWith('/feedback')) return z.object({ content: z.string().min(1).max(4000) })
  if (path.endsWith('/templates')) return templateDocumentSchema
  if (method === 'PUT' && /\/templates\/:id$/.test(path))
    return z.object({ document: templateDocumentSchema, revision: z.number().int().positive() })
}
/** 从已注册路由和共享契约生成接口目录；认证保持 Better Auth 原生协议。 */
export function buildOpenApi(routes: { path: string; method: string }[]) {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const route of routes) {
    if (!route.path.startsWith('/api/v1/') || route.path.includes('*') || route.method === 'ALL')
      continue
    const path = route.path.replace(/:([a-zA-Z]+)/g, '{$1}'),
      read = route.method === 'GET'
    const isPublic = path.includes('/public/') || path.endsWith('/capabilities')
    const list =
      read &&
      /\/(templates|materials|contacts|reviews|delivery-jobs|audit-logs)$/.test(path) &&
      !path.includes('/experience/')
    const parameters: unknown[] = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }))
    if (list)
      for (const [name, schema] of Object.entries(
        (json(pageSchema) as { properties: Record<string, unknown> }).properties,
      ))
        parameters.push({ name, in: 'query', schema })
    if (route.method === 'POST' && path.endsWith('/delivery-jobs'))
      parameters.push({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        schema: { type: 'string', maxLength: 128 },
      })
    const request = bodyFor(route.path, route.method)
    const resource = path.includes('/versions/')
      ? 'Version'
      : path.includes('/tasks/') || path.includes('/delivery-jobs/')
        ? 'Task'
        : undefined
    const data = resource
      ? { $ref: '#/components/schemas/' + resource }
      : list
        ? { type: 'array', items: { type: 'object' } }
        : {}
    const response = {
      type: 'object',
      required: ['subCode', 'message', 'data'],
      properties: {
        subCode: { type: 'integer', const: 0 },
        message: { type: 'string' },
        data,
        requestId: { type: 'string' },
        ...(list ? { pageInfo: { $ref: '#/components/schemas/PageInfo' } } : {}),
      },
    }
    const success =
      route.method === 'POST' && /\/delivery-jobs$|\/precheck\/deep$|\/retry$/.test(path)
        ? 202
        : route.method === 'POST' && /\/templates$|\/materials$|\/contacts$/.test(path)
          ? 201
          : 200
    paths[path] ??= {}
    paths[path]![route.method.toLowerCase()] = {
      operationId: route.method.toLowerCase() + path.replace(/[^a-zA-Z0-9]/g, '_'),
      tags: [path.split('/')[5] ?? path.split('/')[3]],
      security: isPublic ? [] : [{ sessionCookie: [] }],
      parameters,
      ...(request
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { schema: json(request) } },
            },
          }
        : path.endsWith('/materials') && route.method === 'POST'
          ? {
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      required: ['file'],
                      properties: { file: { type: 'string', format: 'binary' } },
                    },
                  },
                },
              },
            }
          : {}),
      responses: {
        [success]: { description: '成功', content: { 'application/json': { schema: response } } },
        ...Object.fromEntries(
          [400, 401, 403, 404, 409, 413, 422, 429, 503].map((code) => [
            code,
            {
              description: '业务错误；按 subCode 处理',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          ]),
        ),
      },
    }
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'AIM Studio API',
      version: '0.2.0',
      description:
        'HttpOnly Cookie 会话；业务数据按工作空间隔离；写请求校验 Origin。分页从 1 开始。HTTPS 下会话 Cookie 使用 __Secure- 前缀。',
    },
    paths,
    components: {
      securitySchemes: {
        sessionCookie: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
      },
      schemas,
    },
  }
}
