import { readPage } from './read-models'
import { buildOpenApi } from './openapi'
import { inspectMedia } from './media'
import { isDeepStrictEqual } from 'node:util'
import { checkPublicLink } from './link-check'
import { providers } from './providers'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z, ZodError } from 'zod'
import { createHash, randomBytes } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import {
  can,
  contactSchema,
  deliverySchema,
  experienceRecordQuerySchema,
  experienceTemplateQuerySchema,
  pageSchema,
  preferencesSchema,
  roles,
  submitSchema,
  workspaceSchema,
} from '@aim/api-contracts'
import { INTEGRATED_CARD_IDS } from '@aim/template-core'
import { getLayout, VENDORS } from '@aim/template-schema'
import { auth } from './auth'
import { assert, BusinessError, config, id, pool, record, transaction } from './context'
import { cleanDocument, saveTemplate, submit, summary } from './templates'
import { storage } from './storage'

type Env = {
  Variables: {
    user: { id: string; name: string; email: string }
    workspace: string
    role: string
    requestId: string
  }
}
export const app = new Hono<Env>()
const hash = (v: string) => createHash('sha256').update(v).digest('hex')
const ok = (data: unknown) => ({ subCode: 0, message: 'OK', data })
app.use('*', async (c, next) => {
  const started = Date.now()
  c.set('requestId', id())
  c.header('X-Request-Id', c.get('requestId'))
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Cache-Control', 'no-store')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin')
    if (origin && origin !== new URL(config.PUBLIC_URL).origin)
      throw new BusinessError(403, 9003, '请求来源不受信任')
    if (c.req.header('sec-fetch-site') === 'cross-site')
      throw new BusinessError(403, 9003, '不允许跨站操作')
  }
  await next()
  console.log(
    JSON.stringify({
      requestId: c.get('requestId'),
      method: c.req.method,
      route: c.req.routePath,
      status: c.res.status,
      durationMs: Date.now() - started,
    }),
  )
})
app.use(
  '*',
  bodyLimit({
    maxSize: config.UPLOAD_MAX_BYTES + 1024 * 1024,
    onError: (c) => c.json({ subCode: 1001, message: '上传文件过大', data: null }, 413),
  }),
)
app.onError((e, c) => {
  if (e instanceof ZodError)
    return c.json(
      {
        subCode: 1001,
        message: '参数格式不正确',
        data: null,
        fieldErrors: e.flatten().fieldErrors,
        requestId: c.get('requestId'),
      },
      400,
    )
  if (e instanceof BusinessError)
    return c.json(
      { subCode: e.code, message: e.message, data: null, requestId: c.get('requestId') },
      e.status as 400,
    )
  if ((e as { code?: string }).code === '23505')
    return c.json({ subCode: 2002, message: '数据已存在，请刷新后重试', data: null }, 409)
  console.error(
    JSON.stringify({
      requestId: c.get('requestId'),
      error: e.name,
      code: (e as { code?: string }).code,
    }),
  )
  return c.json(
    {
      subCode: 5000,
      message: '服务暂不可用，请稍后重试',
      data: null,
      requestId: c.get('requestId'),
    },
    500,
  )
})
app.get('/api/openapi.json', (c) => c.json(buildOpenApi(app.routes)))
app.get('/health/live', (c) => c.json({ status: 'ok' }))
// 网关把 /api/* 全部转发到 API；/api/health 与前端健康检查保持一致。
app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.get('/health/ready', async (c) => {
  await pool.query('SELECT 1')
  return c.json({ status: 'ok' })
})
app.get('/api/v1/capabilities', (c) =>
  c.json(
    ok({
      mode: config.PROVIDER_MODE,
      send: config.PROVIDER_MODE === 'simulated',
      ability: config.PROVIDER_MODE === 'simulated',
      ai: config.PROVIDER_MODE === 'simulated',
      vendorReview: false,
      wechat: false,
    }),
  ),
)
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  // 组织写操作统一走带审计及最后所有者保护的业务接口。
  if (c.req.path.includes('/organization/'))
    throw new BusinessError(403, 9003, '请通过工作空间接口操作')
  const key = `auth:${hash(c.req.header('x-real-ip') ?? 'local')}`
  if (c.req.method === 'POST') {
    const rate = await pool.query(
      "INSERT INTO rate_limits(key,hits,expires_at) VALUES($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.hits+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+interval '1 minute' ELSE rate_limits.expires_at END RETURNING hits",
      [key],
    )
    assert(rate.rows[0].hits <= 30, 429, 1003, '操作过于频繁，请稍后重试')
  }
  return auth.handler(c.req.raw)
})
app.get('/api/v1/public/shares/:token', async (c) => {
  const row = (
    await pool.query(
      'SELECT * FROM shares WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',
      [hash(c.req.param('token'))],
    )
  ).rows[0]
  assert(row)
  const document = JSON.parse(
    JSON.stringify(row.document).replace(
      /\/api\/v1\/files\/([a-zA-Z0-9-]+)/g,
      `/api/v1/public/shares/${c.req.param('token')}/files/$1`,
    ),
  )
  return c.json(ok({ document, expiresAt: row.expires_at }))
})
async function fileResponse(c: any, row: { key: string; mime: string }) {
  const size = await storage.size(row.key),
    range = c.req.header('range') as string | undefined
  c.header('Content-Type', row.mime)
  c.header('Accept-Ranges', 'bytes')
  c.header('Content-Disposition', 'inline')
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match || (!match[1] && !match[2])) {
      c.header('Content-Range', 'bytes */' + size)
      return c.body(null, 416)
    }
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2])),
      end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start > end ||
      start >= size ||
      (!match[1] && Number(match[2]) === 0)
    ) {
      c.header('Content-Range', 'bytes */' + size)
      return c.body(null, 416)
    }
    c.header('Content-Range', 'bytes ' + start + '-' + end + '/' + size)
    c.header('Content-Length', String(end - start + 1))
    return c.body(await storage.stream(row.key, { start, end }), 206)
  }
  c.header('Content-Length', String(size))
  return c.body(await storage.stream(row.key))
}
app.get('/api/v1/public/shares/:token/files/:file', async (c) => {
  const share = (
    await pool.query(
      'SELECT * FROM shares WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',
      [hash(c.req.param('token'))],
    )
  ).rows[0]
  assert(share)
  assert(
    (
      await pool.query(
        'SELECT material_id FROM share_materials WHERE share_id=$1 AND material_id=$2 AND workspace_id=$3',
        [share.id, c.req.param('file'), share.workspace_id],
      )
    ).rowCount,
  )
  const row = (
    await pool.query('SELECT * FROM materials WHERE id=$1 AND workspace_id=$2', [
      c.req.param('file'),
      share.workspace_id,
    ])
  ).rows[0]
  assert(row)
  return fileResponse(c, row)
})
app.use('/api/v1/*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  assert(session, 401, 9001, '请先登录')
  assert(session.user.emailVerified, 403, 9003, '请先验证邮箱')
  c.set('user', session.user)
  await next()
})
app.get('/api/v1/me', async (c) => {
  const prefs = (
    await pool.query('SELECT locale,theme,timezone FROM preferences WHERE user_id=$1', [
      c.get('user').id,
    ])
  ).rows[0] ?? { locale: 'zh-CN', theme: 'system', timezone: 'Asia/Shanghai' }
  return c.json(ok({ ...c.get('user'), preferences: prefs }))
})
app.put('/api/v1/me/preferences', async (c) => {
  const p = preferencesSchema.parse(await c.req.json())
  const result = await pool.query(
    "INSERT INTO preferences(user_id,locale,theme,timezone) VALUES($1,COALESCE($2,'zh-CN'),COALESCE($3,'system'),COALESCE($4,'Asia/Shanghai')) ON CONFLICT(user_id) DO UPDATE SET locale=COALESCE($2,preferences.locale),theme=COALESCE($3,preferences.theme),timezone=COALESCE($4,preferences.timezone) RETURNING locale,theme,timezone",
    [c.get('user').id, p.locale, p.theme, p.timezone],
  )
  return c.json(ok(result.rows[0]))
})
app.get('/api/v1/workspaces', async (c) =>
  c.json(
    ok(
      (
        await pool.query(
          'SELECT o.id,o.name,o.slug,m.role FROM organization o JOIN member m ON m.organization_id=o.id WHERE m.user_id=$1 ORDER BY o.created_at',
          [c.get('user').id],
        )
      ).rows,
    ),
  ),
)
app.post('/api/v1/workspaces', async (c) => {
  const body = workspaceSchema.extend({ default: z.boolean().optional() }).parse(await c.req.json())
  const user = c.get('user')
  const result = await transaction(async (client) => {
    await client.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [user.id])
    if (body.default) {
      const found = (
        await client.query(
          'SELECT o.id,o.name,o.slug,m.role FROM organization o JOIN member m ON m.organization_id=o.id WHERE m.user_id=$1 ORDER BY o.created_at LIMIT 1',
          [user.id],
        )
      ).rows[0]
      if (found) return found
    }
    const workspace = id()
    await client.query('INSERT INTO organization(id,name,slug) VALUES($1,$2,$3)', [
      workspace,
      body.name,
      workspace,
    ])
    await client.query(
      "INSERT INTO member(id,organization_id,user_id,role) VALUES($1,$2,$3,'owner')",
      [id(), workspace, user.id],
    )
    await record(client, workspace, user.id, 'workspace.create', workspace)
    return { id: workspace, name: body.name, slug: workspace, role: 'owner' }
  })
  return c.json(ok(result), 201)
})
app.post('/api/v1/invitations/:token/accept', async (c) => {
  const data = await transaction(async (client) => {
    const row = (
      await client.query(
        "SELECT * FROM invitation WHERE id=$1 AND status='pending' AND expires_at>now() FOR UPDATE",
        [c.req.param('token')],
      )
    ).rows[0]
    assert(row)
    assert(
      row.email.toLowerCase() === c.get('user').email.toLowerCase(),
      403,
      9003,
      '请使用被邀请的邮箱登录',
    )
    await client.query(
      'INSERT INTO member(id,organization_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,user_id) DO NOTHING',
      [id(), row.organization_id, c.get('user').id, row.role],
    )
    await client.query("UPDATE invitation SET status='accepted' WHERE id=$1", [row.id])
    await record(client, row.organization_id, c.get('user').id, 'invitation.accept', row.id)
    return { workspaceId: row.organization_id }
  })
  return c.json(ok(data))
})
app.get('/api/v1/files/:file', async (c) => {
  const row = (
    await pool.query(
      'SELECT f.* FROM materials f JOIN member m ON m.organization_id=f.workspace_id WHERE f.id=$1 AND m.user_id=$2',
      [c.req.param('file'), c.get('user').id],
    )
  ).rows[0]
  assert(row)
  return fileResponse(c, row)
})
app.get('/api/v1/resolve-template/:id', async (c) => {
  const row = (
    await pool.query(
      'SELECT t.workspace_id FROM templates t JOIN member m ON m.organization_id=t.workspace_id WHERE t.id=$1 AND m.user_id=$2',
      [c.req.param('id'), c.get('user').id],
    )
  ).rows[0]
  assert(row)
  return c.json(ok({ workspaceId: row.workspace_id }))
})
app.use('/api/v1/workspaces/:workspace/*', async (c, next) => {
  const workspace = c.req.param('workspace')!
  const membership = (
    await pool.query('SELECT role FROM member WHERE organization_id=$1 AND user_id=$2', [
      workspace,
      c.get('user').id,
    ])
  ).rows[0]
  assert(membership, 403, 9003, '没有当前工作空间权限')
  c.set('workspace', workspace)
  c.set('role', membership.role)
  await next()
})
const requirePermission = (c: any, action: string) =>
  assert(can(c.get('role'), action), 403, 9003, '没有执行此操作的权限')
const prefix = '/api/v1/workspaces/:workspace'
app.get(`${prefix}/overview`, async (c) => {
  const ws = c.get('workspace')
  const counts = (
    await pool.query(
      "SELECT count(*)::int total,count(*) FILTER(WHERE status='draft')::int drafts,count(*) FILTER(WHERE status='reviewing')::int reviewing,count(*) FILTER(WHERE published_version_id IS NOT NULL)::int published FROM templates WHERE workspace_id=$1 AND archived=false",
      [ws],
    )
  ).rows[0]
  const recent = (
    await pool.query(
      'SELECT * FROM templates WHERE workspace_id=$1 AND archived=false ORDER BY updated_at DESC LIMIT 5',
      [ws],
    )
  ).rows.map((r) => summary(r, false))
  const activity = (
    await pool.query(
      'SELECT action,target_id,created_at FROM audit_logs WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 8',
      [ws],
    )
  ).rows
  return c.json(ok({ ...counts, recent, activity }))
})
app.get(`${prefix}/templates`, async (c) => {
  const q = pageSchema.parse(c.req.query())
  const keyword = c.req.query('keyword') ?? ''
  const status = c.req.query('status') ?? 'all'
  const archived = c.req.query('archived') === 'true'
  const values = [c.get('workspace'), `%${keyword}%`, status, archived]
  const where = "workspace_id=$1 AND name ILIKE $2 AND ($3='all' OR status=$3) AND archived=$4"
  const total = (
    await pool.query(`SELECT count(*)::int total FROM templates WHERE ${where}`, values)
  ).rows[0].total
  const result = await pool.query(
    `SELECT * FROM templates WHERE ${where} ORDER BY updated_at DESC LIMIT $5 OFFSET $6`,
    [...values, q.size, (q.page - 1) * q.size],
  )
  return c.json({
    ...ok(result.rows.map((r) => summary(r, false))),
    pageInfo: { total, page: q.page, size: q.size, pageIndex: q.page, pageSize: q.size },
  })
})
app.get(`${prefix}/templates/:id`, async (c) => {
  const row = (
    await pool.query('SELECT * FROM templates WHERE id=$1 AND workspace_id=$2', [
      c.req.param('id'),
      c.get('workspace'),
    ])
  ).rows[0]
  assert(row)
  return c.json(ok(summary(row)))
})
app.post(`${prefix}/templates`, async (c) => {
  requirePermission(c, 'edit')
  return c.json(
    ok(await saveTemplate(c.get('workspace'), c.get('user').id, await c.req.json())),
    201,
  )
})
app.put(`${prefix}/templates/:id`, async (c) => {
  requirePermission(c, 'edit')
  const body = z
    .object({ document: z.unknown(), revision: z.number().int().positive() })
    .parse(await c.req.json())
  return c.json(
    ok(
      await saveTemplate(
        c.get('workspace'),
        c.get('user').id,
        body.document,
        body.revision,
        c.req.param('id'),
      ),
    ),
  )
})
app.post(`${prefix}/templates/:id/duplicate`, async (c) => {
  requirePermission(c, 'edit')
  const row = (
    await pool.query('SELECT document FROM templates WHERE id=$1 AND workspace_id=$2', [
      c.req.param('id'),
      c.get('workspace'),
    ])
  ).rows[0]
  assert(row)
  const doc = row.document
  doc.id = id()
  doc.name = `${doc.name.slice(0, 15)} 副本`
  return c.json(ok(await saveTemplate(c.get('workspace'), c.get('user').id, doc)))
})
app.post(`${prefix}/templates/:id/submit`, async (c) => {
  requirePermission(c, 'edit')
  const body = submitSchema.parse(await c.req.json())
  return c.json(
    ok(await submit(c.get('workspace'), c.get('user').id, c.req.param('id'), body.revision, body)),
  )
})
app.post(`${prefix}/templates/:id/archive`, async (c) => {
  requirePermission(c, 'edit')
  const { archived } = z.object({ archived: z.boolean() }).parse(await c.req.json())
  await transaction(async (client) => {
    const result = await client.query(
      "UPDATE templates SET archived=$1,updated_at=now() WHERE id=$2 AND workspace_id=$3 AND status!='reviewing' AND (NOT $1 OR published_version_id IS NULL) RETURNING id",
      [archived, c.req.param('id'), c.get('workspace')],
    )
    assert(result.rowCount, 409, 2002, '请先下架或撤回审核')
    await record(
      client,
      c.get('workspace'),
      c.get('user').id,
      archived ? 'template.archive' : 'template.restore',
      c.req.param('id'),
    )
  })
  return c.json(ok(null))
})
app.get(prefix + '/templates/:id/versions', async (c) =>
  c.json(
    ok(
      (
        await pool.query(
          'SELECT v.id,v.revision,v.status,v.created_at,r.reason,r.reviewer_id,r.updated_at AS reviewed_at FROM template_versions v LEFT JOIN reviews r ON r.version_id=v.id WHERE v.workspace_id=$1 AND v.template_id=$2 ORDER BY v.created_at DESC',
          [c.get('workspace'), c.req.param('id')],
        )
      ).rows,
    ),
  ),
)
app.get(prefix + '/templates/:id/versions/:version', async (c) => {
  const row = (
    await pool.query(
      'SELECT id,revision,status,document,converted,created_at FROM template_versions WHERE id=$1 AND template_id=$2 AND workspace_id=$3',
      [c.req.param('version'), c.req.param('id'), c.get('workspace')],
    )
  ).rows[0]
  assert(row)
  return c.json(ok(row))
})
app.get(prefix + '/reviews', async (c) =>
  c.json(
    await readPage(
      'SELECT r.*,t.name,v.document,v.revision FROM reviews r JOIN templates t ON t.id=r.template_id JOIN template_versions v ON v.id=r.version_id WHERE r.workspace_id=$1 ORDER BY r.created_at DESC',
      [c.get('workspace')],
      c.req.query(),
    ),
  ),
)
app.post(`${prefix}/reviews/:id/decision`, async (c) => {
  const body = z
    .object({
      decision: z.enum(['approved', 'rejected', 'withdrawn']),
      reason: z.string().max(1000).default(''),
    })
    .parse(await c.req.json())
  requirePermission(c, body.decision === 'withdrawn' ? 'edit' : 'review')
  assert(body.decision !== 'rejected' || body.reason.trim(), 400, 1001, '请填写驳回原因')
  await transaction(async (client) => {
    const review = (
      await client.query('SELECT * FROM reviews WHERE id=$1 AND workspace_id=$2 FOR UPDATE', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rows[0]
    assert(review)
    assert(review.status === 'reviewing', 409, 2002, '审核已处理')
    const status = body.decision === 'withdrawn' ? 'draft' : body.decision
    await client.query(
      'UPDATE reviews SET status=$1,reason=$2,reviewer_id=$3,updated_at=now() WHERE id=$4',
      [body.decision, body.reason, c.get('user').id, review.id],
    )
    await client.query('UPDATE template_versions SET status=$1 WHERE id=$2', [
      status,
      review.version_id,
    ])
    await client.query(
      'UPDATE templates SET status=$1,updated_at=now() WHERE id=$2 AND revision=(SELECT revision FROM template_versions WHERE id=$3)',
      [status, review.template_id, review.version_id],
    )
    await record(
      client,
      c.get('workspace'),
      c.get('user').id,
      `review.${body.decision}`,
      review.version_id,
    )
    await client.query(
      'INSERT INTO notifications(id,workspace_id,user_id,message) SELECT $1,$2,created_by,$3 FROM templates WHERE id=$4',
      [id(), c.get('workspace'), `review.${body.decision}`, review.template_id],
    )
  })
  return c.json(ok(null))
})
app.post(`${prefix}/templates/:id/publish`, async (c) => {
  requirePermission(c, 'review')
  const body = z.object({ versionId: z.string().nullable() }).parse(await c.req.json())
  await transaction(async (client) => {
    const t = (
      await client.query(
        'SELECT id FROM templates WHERE id=$1 AND workspace_id=$2 AND archived=false FOR UPDATE',
        [c.req.param('id'), c.get('workspace')],
      )
    ).rows[0]
    assert(t)
    if (body.versionId)
      assert(
        (
          await client.query(
            "SELECT id FROM template_versions WHERE id=$1 AND template_id=$2 AND workspace_id=$3 AND status='approved'",
            [body.versionId, t.id, c.get('workspace')],
          )
        ).rowCount,
        409,
        2002,
        '该版本尚未通过审核',
      )
    await client.query(
      'UPDATE templates SET published_version_id=$1,updated_at=now() WHERE id=$2',
      [body.versionId, t.id],
    )
    if (body.versionId)
      await client.query(
        'INSERT INTO publications(id,workspace_id,template_id,version_id,action,user_id) VALUES($1,$2,$3,$4,$5,$6)',
        [id(), c.get('workspace'), t.id, body.versionId, 'publish', c.get('user').id],
      )
    await record(
      client,
      c.get('workspace'),
      c.get('user').id,
      body.versionId ? 'template.publish' : 'template.unpublish',
      t.id,
    )
  })
  return c.json(ok(null))
})
app.get(prefix + '/materials', async (c) =>
  c.json(
    await readPage(
      "SELECT id,name,type,size,metadata,created_at FROM materials WHERE workspace_id=$1 AND ($2='' OR type=$2) AND name ILIKE $3 ORDER BY created_at DESC",
      [c.get('workspace'), c.req.query('type') ?? '', '%' + (c.req.query('keyword') ?? '') + '%'],
      c.req.query(),
      (r) => ({
        ...r,
        ...r.metadata,
        url: '/api/v1/files/' + r.id,
        createdAt: new Date(r.created_at).getTime(),
      }),
    ),
  ),
)
app.post(`${prefix}/materials`, async (c) => {
  requirePermission(c, 'edit')
  const form = await c.req.formData()
  const file = form.get('file')
  assert(file instanceof File, 400, 1001, '请选择文件')
  assert(file.size <= config.UPLOAD_MAX_BYTES, 413, 1001, '文件超过大小限制')
  const data = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(data)
  assert(
    detected &&
      /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm)|audio\/(mpeg|ogg|wav))$/.test(detected.mime),
    400,
    1001,
    '不支持的媒体格式',
  )
  const metadata = await inspectMedia(data, detected.mime)
  const material = id()
  const key = `${c.get('workspace')}/${material}.${detected.ext}`
  await storage.put(key, data, detected.mime)
  try {
    await transaction(async (client) => {
      await client.query('SELECT id FROM organization WHERE id=$1 FOR UPDATE', [c.get('workspace')])
      const usage = (
        await client.query(
          'SELECT COALESCE(sum(size),0)::bigint size FROM materials WHERE workspace_id=$1',
          [c.get('workspace')],
        )
      ).rows[0]
      assert(
        Number(usage.size) + file.size <= config.WORKSPACE_STORAGE_BYTES,
        413,
        1001,
        '工作空间存储额度不足',
      )
      await client.query(
        'INSERT INTO materials(id,workspace_id,name,type,mime,key,size,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          material,
          c.get('workspace'),
          file.name.slice(0, 180),
          detected.mime.split('/')[0],
          detected.mime,
          key,
          file.size,
          JSON.stringify(metadata),
        ],
      )
      await record(client, c.get('workspace'), c.get('user').id, 'material.upload', material)
    })
  } catch (e) {
    await storage.delete(key)
    throw e
  }
  return c.json(
    ok({
      id: material,
      name: file.name,
      type: detected.mime.split('/')[0],
      url: `/api/v1/files/${material}`,
      size: file.size,
      ...metadata,
      createdAt: Date.now(),
    }),
    201,
  )
})
app.delete(`${prefix}/materials/:id`, async (c) => {
  requirePermission(c, 'edit')
  await transaction(async (client) => {
    const row = (
      await client.query('SELECT * FROM materials WHERE id=$1 AND workspace_id=$2 FOR UPDATE', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rows[0]
    assert(row)
    assert(
      !(
        await client.query('SELECT id FROM material_references WHERE material_id=$1 LIMIT 1', [
          row.id,
        ])
      ).rowCount,
      409,
      2002,
      '素材已被模板版本引用',
    )
    assert(
      !(
        await client.query(
          'SELECT s.id FROM shares s JOIN share_materials m ON m.share_id=s.id WHERE s.workspace_id=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND m.material_id=$2 LIMIT 1',
          [c.get('workspace'), row.id],
        )
      ).rowCount,
      409,
      2002,
      '素材仍被有效分享引用，请先撤销分享',
    )
    await client.query('DELETE FROM share_materials WHERE material_id=$1', [row.id])
    await client.query('DELETE FROM materials WHERE id=$1', [row.id])
    await client.query('INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)', [
      id(),
      'file-delete',
      JSON.stringify({ key: row.key }),
    ])
    await record(client, c.get('workspace'), c.get('user').id, 'material.delete', row.id)
  })
  return c.json(ok(null))
})
app.get(prefix + '/contacts', async (c) =>
  c.json(
    await readPage(
      'SELECT id,contact_name AS "contactName",mobile,created_at AS "createdAt" FROM contacts WHERE workspace_id=$1 ORDER BY created_at DESC',
      [c.get('workspace')],
      c.req.query(),
      (r) => ({
        ...r,
        mobile:
          c.get('role') === 'viewer'
            ? r.mobile.slice(0, 3) + '****' + r.mobile.slice(-4)
            : r.mobile,
      }),
    ),
  ),
)
app.post(`${prefix}/contacts`, async (c) => {
  requirePermission(c, 'send')
  const body = contactSchema.parse(await c.req.json())
  const result = await pool.query(
    'INSERT INTO contacts(id,workspace_id,contact_name,mobile) VALUES($1,$2,$3,$4) RETURNING id',
    [id(), c.get('workspace'), body.contactName, body.mobile],
  )
  return c.json(ok({ ...body, ...result.rows[0] }), 201)
})
app.put(`${prefix}/contacts/:id`, async (c) => {
  requirePermission(c, 'send')
  const body = contactSchema.parse(await c.req.json())
  assert(
    (
      await pool.query(
        'UPDATE contacts SET contact_name=$1,mobile=$2 WHERE id=$3 AND workspace_id=$4',
        [body.contactName, body.mobile, c.req.param('id'), c.get('workspace')],
      )
    ).rowCount,
  )
  return c.json(ok(null))
})
app.delete(`${prefix}/contacts/:id`, async (c) => {
  requirePermission(c, 'send')
  assert(
    (
      await pool.query('DELETE FROM contacts WHERE id=$1 AND workspace_id=$2', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rowCount,
  )
  return c.json(ok(null))
})
app.get(`${prefix}/team`, async (c) => {
  requirePermission(c, 'team')
  return c.json(
    ok({
      members: (
        await pool.query(
          'SELECT m.id,m.role,m.user_id,u.name,u.email FROM member m JOIN "user" u ON u.id=m.user_id WHERE m.organization_id=$1',
          [c.get('workspace')],
        )
      ).rows,
      invitations: (
        await pool.query(
          'SELECT id,email,role,status,expires_at FROM invitation WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100',
          [c.get('workspace')],
        )
      ).rows,
    }),
  )
})
app.post(`${prefix}/team/invite`, async (c) => {
  requirePermission(c, 'team')
  const body = z
    .object({ email: z.email(), role: z.enum(['admin', 'editor', 'reviewer', 'viewer']) })
    .parse(await c.req.json())
  const token = randomBytes(32).toString('base64url')
  await transaction(async (client) => {
    await client.query(
      "INSERT INTO invitation(id,organization_id,email,role,expires_at,inviter_id) VALUES($1,$2,$3,$4,now()+interval '7 days',$5)",
      [token, c.get('workspace'), body.email.toLowerCase(), body.role, c.get('user').id],
    )
    await client.query('INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)', [
      id(),
      'mail',
      JSON.stringify({
        to: body.email,
        subject: '工作空间邀请 / Workspace invitation — AIM Studio',
        text: `${config.PUBLIC_URL}/zh-CN/invite/${token}`,
      }),
    ])
    await record(client, c.get('workspace'), c.get('user').id, 'team.invite')
  })
  return c.json(ok({ sent: true }))
})
app.post(`${prefix}/team/:id`, async (c) => {
  requirePermission(c, 'team')
  const body = z
    .object({
      role: z.enum(roles).optional(),
      remove: z.boolean().optional(),
      transfer: z.boolean().optional(),
    })
    .parse(await c.req.json())
  await transaction(async (client) => {
    await client.query('SELECT id FROM organization WHERE id=$1 FOR UPDATE', [c.get('workspace')])
    const target = (
      await client.query('SELECT * FROM member WHERE id=$1 AND organization_id=$2 FOR UPDATE', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rows[0]
    assert(target)
    assert(
      target.role !== 'owner' || c.get('role') === 'owner',
      403,
      9003,
      '只有所有者可以调整所有权',
    )
    assert(body.role !== 'owner' || c.get('role') === 'owner', 403, 9003, '无权授予所有者角色')
    if (body.transfer) {
      requirePermission(c, 'own')
      assert(target.user_id !== c.get('user').id, 400, 1001, '请选择其他成员')
      await client.query("UPDATE member SET role='owner' WHERE id=$1", [target.id])
      await client.query("UPDATE member SET role='admin' WHERE user_id=$1 AND organization_id=$2", [
        c.get('user').id,
        c.get('workspace'),
      ])
    } else {
      if (target.role === 'owner' && (body.remove || body.role !== 'owner'))
        assert(
          (
            await client.query("SELECT id FROM member WHERE organization_id=$1 AND role='owner'", [
              c.get('workspace'),
            ])
          ).rowCount! > 1,
          409,
          2002,
          '不能移除最后一个所有者',
        )
      if (body.remove) await client.query('DELETE FROM member WHERE id=$1', [target.id])
      else {
        assert(body.role, 400, 1001, '请选择角色')
        await client.query('UPDATE member SET role=$1 WHERE id=$2', [body.role, target.id])
      }
    }
    await record(
      client,
      c.get('workspace'),
      c.get('user').id,
      body.transfer ? 'team.transfer' : body.remove ? 'team.remove' : 'team.role',
      target.id,
    )
  })
  return c.json(ok(null))
})
app.put(`${prefix}/settings`, async (c) => {
  requirePermission(c, 'manage')
  const body = workspaceSchema.parse(await c.req.json())
  await pool.query('UPDATE organization SET name=$1 WHERE id=$2', [body.name, c.get('workspace')])
  return c.json(ok(body))
})
app.get(prefix + '/audit-logs', async (c) => {
  requirePermission(c, 'team')
  return c.json(
    await readPage(
      'SELECT id,action,target_id,created_at FROM audit_logs WHERE workspace_id=$1 ORDER BY created_at DESC',
      [c.get('workspace')],
      c.req.query(),
    ),
  )
})
app.get(`${prefix}/notifications`, async (c) =>
  c.json(
    ok(
      (
        await pool.query(
          'SELECT id,message,read,created_at FROM notifications WHERE workspace_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 50',
          [c.get('workspace'), c.get('user').id],
        )
      ).rows,
    ),
  ),
)
app.post(`${prefix}/notifications/:id/read`, async (c) => {
  await pool.query(
    'UPDATE notifications SET read=true WHERE id=$1 AND workspace_id=$2 AND user_id=$3',
    [c.req.param('id'), c.get('workspace'), c.get('user').id],
  )
  return c.json(ok(null))
})
app.post(`${prefix}/feedback`, async (c) => {
  const body = z.object({ content: z.string().trim().min(1).max(4000) }).parse(await c.req.json())
  const key = id()
  await pool.query('INSERT INTO feedback(id,workspace_id,user_id,content) VALUES($1,$2,$3,$4)', [
    key,
    c.get('workspace'),
    c.get('user').id,
    body.content,
  ])
  return c.json(ok({ id: key }))
})
app.post(`${prefix}/shares`, async (c) => {
  requirePermission(c, 'edit')
  const body = z.object({ templateId: z.string() }).parse(await c.req.json())
  const token = randomBytes(32).toString('base64url'),
    share = id()
  await transaction(async (client) => {
    const row = (
      await client.query(
        'SELECT document FROM templates WHERE id=$1 AND workspace_id=$2 FOR SHARE',
        [body.templateId, c.get('workspace')],
      )
    ).rows[0]
    assert(row)
    const files = [
      ...new Set(
        [...JSON.stringify(row.document).matchAll(/\/api\/v1\/files\/([a-zA-Z0-9-]+)/g)].map(
          (m) => m[1]!,
        ),
      ),
    ].sort()
    for (const file of files)
      assert(
        (
          await client.query(
            'SELECT id FROM materials WHERE id=$1 AND workspace_id=$2 FOR KEY SHARE',
            [file, c.get('workspace')],
          )
        ).rowCount,
        400,
        1001,
        '分享素材不存在或无权访问',
      )
    await client.query(
      "INSERT INTO shares(id,token_hash,workspace_id,template_id,document,expires_at,created_by) VALUES($1,$2,$3,$4,$5,now()+interval '30 minutes',$6)",
      [
        share,
        hash(token),
        c.get('workspace'),
        body.templateId,
        JSON.stringify(row.document),
        c.get('user').id,
      ],
    )
    for (const file of files)
      await client.query(
        'INSERT INTO share_materials(share_id,material_id,workspace_id) VALUES($1,$2,$3)',
        [share, file, c.get('workspace')],
      )
    await record(client, c.get('workspace'), c.get('user').id, 'share.create', share)
  })
  return c.json(
    ok({
      id: share,
      token,
      url: config.PUBLIC_URL + '/m/preview/' + token,
      expiresAt: Date.now() + 1800000,
    }),
  )
})
app.get(`${prefix}/shares`, async (c) => {
  requirePermission(c, 'edit')
  return c.json(
    ok(
      (
        await pool.query(
          'SELECT id,template_id,expires_at,revoked_at,created_at FROM shares WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 100',
          [c.get('workspace')],
        )
      ).rows,
    ),
  )
})
app.delete(`${prefix}/shares/:id`, async (c) => {
  requirePermission(c, 'edit')
  assert(
    (
      await pool.query('UPDATE shares SET revoked_at=now() WHERE id=$1 AND workspace_id=$2', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rowCount,
  )
  return c.json(ok(null))
})
app.post(`${prefix}/precheck/deep`, async (c) => {
  requirePermission(c, 'edit')
  const body = z.object({ document: z.unknown() }).parse(await c.req.json())
  const doc = cleanDocument(body.document)
  const task = id()
  await transaction(async (client) => {
    await client.query(
      'INSERT INTO jobs(id,workspace_id,kind,mode,payload,created_by) VALUES($1,$2,$3,$4,$5,$6)',
      [
        task,
        c.get('workspace'),
        'precheck',
        'local',
        JSON.stringify({ document: doc }),
        c.get('user').id,
      ],
    )
    await client.query('INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)', [
      id(),
      'job',
      JSON.stringify({ id: task }),
    ])
  })
  return c.json(ok({ taskId: task, status: 'running', progress: 0, issues: [] }), 202)
})
app.get(`${prefix}/tasks/:id`, async (c) => {
  const row = (
    await pool.query(
      'SELECT id,kind,status,mode,result,error FROM jobs WHERE id=$1 AND workspace_id=$2',
      [c.req.param('id'), c.get('workspace')],
    )
  ).rows[0]
  assert(row)
  if (c.get('role') === 'viewer' && row.kind === 'ability') row.result = null
  return c.json(ok(row))
})
app.get(`${prefix}/precheck/deep/:id`, async (c) => {
  const row = (
    await pool.query("SELECT * FROM jobs WHERE id=$1 AND workspace_id=$2 AND kind='precheck'", [
      c.req.param('id'),
      c.get('workspace'),
    ])
  ).rows[0]
  assert(row)
  return c.json(
    ok({
      taskId: row.id,
      status: row.status === 'done' ? 'done' : row.status === 'failed' ? 'failed' : 'running',
      progress: row.status === 'done' ? 100 : 10,
      issues: row.result?.issues ?? [],
      dimensions: [],
    }),
  )
})
app.post(`${prefix}/delivery-jobs`, async (c) => {
  requirePermission(c, 'send')
  assert(config.PROVIDER_MODE === 'simulated', 503, 3001, '发送通道尚未配置')
  const body = deliverySchema.parse(await c.req.json())
  const key = c.req.header('idempotency-key')
  assert(key && key.length <= 128, 400, 1001, '请提供幂等请求标识')
  const result = await transaction(async (client) => {
    await client.query('SELECT id FROM organization WHERE id=$1 FOR UPDATE', [c.get('workspace')])
    const old = (
      await client.query(
        "SELECT * FROM jobs WHERE workspace_id=$1 AND kind='delivery' AND idempotency_key=$2",
        [c.get('workspace'), key],
      )
    ).rows[0]
    if (old) {
      assert(isDeepStrictEqual(old.payload.request, body), 409, 2002, '相同幂等键对应不同请求')
      return old
    }
    const t = (
      await client.query(
        'SELECT v.document,v.id FROM templates t JOIN template_versions v ON v.id=t.published_version_id WHERE t.id=$1 AND t.workspace_id=$2 AND t.archived=false',
        [body.templateId, c.get('workspace')],
      )
    ).rows[0]
    assert(t, 400, 1001, '请先发布模板')
    assert(t.document.params.length === 0, 400, 1001, '带动态参数的模板不能直接体验发送')
    const job = id()
    const row = (
      await client.query(
        'INSERT INTO jobs(id,workspace_id,kind,mode,payload,idempotency_key,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [
          job,
          c.get('workspace'),
          'delivery',
          'simulated',
          JSON.stringify({ request: body, versionId: t.id }),
          key,
          c.get('user').id,
        ],
      )
    ).rows[0]
    for (const mobile of new Set(body.mobiles))
      await client.query(
        'INSERT INTO deliveries(id,workspace_id,job_id,mobile,message_type) VALUES($1,$2,$3,$4,$5)',
        [
          id(),
          c.get('workspace'),
          job,
          mobile,
          body.sendMode === 'priority' ? 1 : Number(body.sendMode),
        ],
      )
    await client.query('INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)', [
      id(),
      'job',
      JSON.stringify({ id: job }),
    ])
    await record(client, c.get('workspace'), c.get('user').id, 'delivery.create', job)
    return row
  })
  return c.json(ok({ id: result.id, status: result.status, mode: result.mode }), 202)
})
app.get(prefix + '/delivery-jobs', async (c) =>
  c.json(
    await readPage(
      "SELECT id,status,mode,result,error,created_at FROM jobs WHERE workspace_id=$1 AND kind='delivery' ORDER BY created_at DESC",
      [c.get('workspace')],
      c.req.query(),
    ),
  ),
)
app.get(`${prefix}/delivery-jobs/:id`, async (c) => {
  const job = (
    await pool.query(
      "SELECT id,status,mode,result,error FROM jobs WHERE id=$1 AND workspace_id=$2 AND kind='delivery'",
      [c.req.param('id'), c.get('workspace')],
    )
  ).rows[0]
  assert(job)
  const rows = (
    await pool.query(
      'SELECT id,mobile,status,message_type FROM deliveries WHERE job_id=$1 AND workspace_id=$2',
      [job.id, c.get('workspace')],
    )
  ).rows
  return c.json(
    ok({
      ...job,
      items: rows.map((r) => ({
        ...r,
        mobile:
          c.get('role') === 'viewer'
            ? `${r.mobile.slice(0, 3)}****${r.mobile.slice(-4)}`
            : r.mobile,
      })),
    }),
  )
})
app.post(`${prefix}/ai/copywriting`, async (c) => {
  requirePermission(c, 'edit')
  assert(config.PROVIDER_MODE === 'simulated', 503, 3001, 'AI 通道尚未配置')
  const body = z
    .object({ prompt: z.string().min(1).max(1000), maxLength: z.number().int().min(1).max(1000) })
    .passthrough()
    .parse(await c.req.json())
  const result = await providers.copy.generate(body.prompt, body.maxLength)
  return c.json(ok({ mode: result.mode, candidates: result.data }))
})
app.post(`${prefix}/tools/link-check`, async (c) => {
  requirePermission(c, 'edit')
  const { url } = z.object({ url: z.url() }).parse(await c.req.json())
  const parsed = new URL(url)
  assert(
    parsed.protocol === 'https:' && !parsed.username && !parsed.password,
    400,
    1001,
    '仅支持 HTTPS 链接',
  )
  try {
    return c.json(ok(await checkPublicLink(url)))
  } catch (error) {
    return c.json(ok({ url, reachable: false, https: true, message: (error as Error).message }))
  }
})
/** 已发布版本统一映射为移动端体验模板。 */
const experienceTemplate = (row: Record<string, any>) => ({
  tplId: row.id,
  tplName: row.document.name,
  cardId: row.document.cardId,
  styleName: getLayout(row.document.cardId ?? row.document.layoutId)?.name ?? row.document.layoutId,
  industryId: row.document.meta.industry ?? '',
  industryName: row.document.meta.industry ?? '',
  labels: [],
  factories: row.document.vendors,
  carriers: [],
  paramcnt: row.document.params.length,
  integrated: INTEGRATED_CARD_IDS.includes(row.document.cardId),
  document: row.document,
  conversion: row.converted,
})
const experienceTemplateSql = `SELECT t.id,v.document,v.converted FROM templates t
  JOIN template_versions v ON v.id=t.published_version_id
  WHERE t.workspace_id=$1 AND t.archived=false
    AND ($2='' OR v.document->>'name' ILIKE $2)
    AND ($3='' OR v.document->>'cardId' = ANY(string_to_array($3,',')))
    AND ($4='' OR COALESCE(v.document->'meta'->>'industry','') = ANY(string_to_array($4,',')))
    AND ($5='' OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(v.document->'vendors','[]'::jsonb)) AS f(vendor)
      WHERE f.vendor = ANY(string_to_array($5,','))
    ))
    AND ($6=false OR v.document->>'cardId' = ANY($7::text[]))
  ORDER BY t.updated_at DESC,t.id`
app.get(`${prefix}/experience/templates`, async (c) => {
  const q = experienceTemplateQuerySchema.parse(c.req.query())
  return c.json(
    await readPage(
      experienceTemplateSql,
      [
        c.get('workspace'),
        q.keyword ? `%${q.keyword}%` : '',
        q.styleIds,
        q.industryIds,
        q.factories,
        q.integrated === 'true',
        INTEGRATED_CARD_IDS,
      ],
      c.req.query(),
      experienceTemplate,
    ),
  )
})
app.get(`${prefix}/experience/templates/:id`, async (c) => {
  const row = (
    await pool.query(
      'SELECT t.id,v.document,v.converted FROM templates t JOIN template_versions v ON v.id=t.published_version_id WHERE t.id=$1 AND t.workspace_id=$2 AND t.archived=false',
      [c.req.param('id'), c.get('workspace')],
    )
  ).rows[0]
  assert(row)
  return c.json(ok(experienceTemplate(row)))
})
app.get(`${prefix}/experience/filter-options`, async (c) => {
  const ws = c.get('workspace')
  const [industries, styles] = await Promise.all([
    pool.query(
      `SELECT DISTINCT v.document->'meta'->>'industry' AS industry FROM templates t
        JOIN template_versions v ON v.id=t.published_version_id
        WHERE t.workspace_id=$1 AND t.archived=false
          AND COALESCE(v.document->'meta'->>'industry','')<>'' ORDER BY industry`,
      [ws],
    ),
    pool.query(
      `SELECT DISTINCT v.document->>'cardId' AS card_id FROM templates t
        JOIN template_versions v ON v.id=t.published_version_id
        WHERE t.workspace_id=$1 AND t.archived=false ORDER BY card_id`,
      [ws],
    ),
  ])
  return c.json(
    ok({
      industries: industries.rows.map((r) => ({ id: r.industry, name: r.industry })),
      styles: styles.rows.map((r) => ({
        id: r.card_id,
        name: getLayout(r.card_id)?.name ?? r.card_id,
      })),
      labels: [],
      carriers: [],
      factories: Object.entries(VENDORS).map(([id, vendor]) => ({ id, name: vendor.name })),
    }),
  )
})
app.get(prefix + '/experience/records/:id/template', async (c) => {
  const row = (
    await pool.query(
      "SELECT v.document,v.converted FROM deliveries d JOIN jobs j ON j.id=d.job_id JOIN template_versions v ON v.id=j.payload->>'versionId' WHERE d.id=$1 AND d.workspace_id=$2",
      [c.req.param('id'), c.get('workspace')],
    )
  ).rows[0]
  assert(row)
  return c.json(ok({ document: row.document, conversion: row.converted }))
})
app.post(`${prefix}/ability/query`, async (c) => {
  requirePermission(c, 'send')
  assert(config.PROVIDER_MODE === 'simulated', 503, 3001, '终端能力通道未配置')
  const { source } = z.object({ source: z.string().max(1000) }).parse(await c.req.json())
  const mobiles = [
    ...new Set(source.split(/[\s,;，；]+/).filter((v) => /^\+?\d{7,15}$/.test(v))),
  ].slice(0, 10)
  const result = await providers.ability.query(mobiles)
  await pool.query(
    'INSERT INTO jobs(id,workspace_id,kind,status,mode,payload,result,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [
      id(),
      c.get('workspace'),
      'ability',
      'done',
      result.mode,
      JSON.stringify({ count: mobiles.length }),
      JSON.stringify(result.data),
      c.get('user').id,
    ],
  )
  return c.json(ok({ mode: result.mode, mobiles: result.data }))
})
const experienceRecordSql = `SELECT * FROM (
  SELECT d.id,d.job_id,d.mobile,d.message_type,d.created_at,d.status AS delivery_status,
    j.mode,j.status AS job_status,j.error AS job_error,j.payload,
    v.document->>'name' AS name,v.document->>'cardId' AS card_id,
    CASE WHEN j.status='failed' THEN 'FAILED'
         WHEN d.status='pending' THEN 'SENDING'
         WHEN d.status='simulated_success' THEN 'SUCCESS'
         ELSE 'FAILED' END AS message_status
  FROM deliveries d
  JOIN jobs j ON j.id=d.job_id
  JOIN template_versions v ON v.id=j.payload->>'versionId'
  WHERE d.workspace_id=$1
) s
WHERE ($2='' OR s.mobile LIKE '%'||$2||'%')
  AND ($3='' OR s.message_status=$3)
  AND ($4='' OR s.created_at >= (NULLIF($4,'')::date::timestamp AT TIME ZONE 'Asia/Shanghai'))
  AND ($5='' OR s.created_at < ((NULLIF($5,'')::date + 1)::timestamp AT TIME ZONE 'Asia/Shanghai'))
ORDER BY s.created_at DESC,s.id`
app.get(`${prefix}/experience/statistics`, async (c) => {
  const q = z
    .object({
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .parse(c.req.query())
  const row = (
    await pool.query(
      `SELECT count(*)::int total,
        count(*) FILTER (WHERE s.message_status='SENDING')::int sending,
        count(*) FILTER (WHERE s.message_status='SUCCESS')::int success,
        count(*) FILTER (WHERE s.message_status='FAILED')::int failed,
        count(*) FILTER (WHERE s.message_type=1)::int type1,
        count(*) FILTER (WHERE s.message_type=2)::int type2,
        count(*) FILTER (WHERE s.message_type=3)::int type3
      FROM (
        SELECT d.message_type,d.created_at,
          CASE WHEN j.status='failed' THEN 'FAILED'
               WHEN d.status='pending' THEN 'SENDING'
               WHEN d.status='simulated_success' THEN 'SUCCESS'
               ELSE 'FAILED' END AS message_status
        FROM deliveries d JOIN jobs j ON j.id=d.job_id
        WHERE d.workspace_id=$1 AND j.mode='simulated'
      ) s
      WHERE ($2='' OR s.created_at >= (NULLIF($2,'')::date::timestamp AT TIME ZONE 'Asia/Shanghai'))
        AND ($3='' OR s.created_at < ((NULLIF($3,'')::date + 1)::timestamp AT TIME ZONE 'Asia/Shanghai'))`,
      [c.get('workspace'), q.startDate ?? '', q.endDate ?? ''],
    )
  ).rows[0]
  return c.json(
    ok({
      total: row.total,
      byStatus: { SENDING: row.sending, SUCCESS: row.success, FAILED: row.failed },
      byType: { 1: row.type1, 2: row.type2, 3: row.type3 },
      byFactory: [],
    }),
  )
})
app.get(`${prefix}/experience/recent-mobiles`, async (c) => {
  const rows = (
    await pool.query(
      `SELECT s.mobile FROM (
        SELECT d.mobile,max(d.created_at) AS last_seen FROM deliveries d
        WHERE d.workspace_id=$1 GROUP BY d.mobile ORDER BY last_seen DESC LIMIT 10
      ) s`,
      [c.get('workspace')],
    )
  ).rows
  return c.json(ok({ mobiles: rows.map((r) => r.mobile) }))
})
app.get(`${prefix}/experience/records`, async (c) => {
  const q = experienceRecordQuerySchema.parse(c.req.query())
  return c.json(
    await readPage(
      experienceRecordSql,
      [c.get('workspace'), q.mobile, q.status ?? '', q.startDate ?? '', q.endDate ?? ''],
      c.req.query(),
      (r) => ({
        id: r.id,
        requestId: r.job_id,
        tplId: r.payload.request.templateId,
        tplName: r.name,
        cardId: r.card_id,
        mobile:
          c.get('role') === 'viewer'
            ? r.mobile.slice(0, 3) + '****' + r.mobile.slice(-4)
            : r.mobile,
        messageType: r.message_type,
        mode: r.mode,
        carrier: r.mode === 'simulated' ? '模拟通道' : '外部通道',
        failReason:
          r.job_status === 'failed' ? '任务处理失败，请在控制台重试或联系管理员。' : undefined,
        status: r.message_status,
        sendTime: new Date(r.created_at).getTime(),
      }),
    ),
  )
})
app.notFound((c) => c.json({ subCode: 2001, message: '接口不存在', data: null }, 404))

app.post(`${prefix}/tasks/:id/retry`, async (c) => {
  await transaction(async (client) => {
    const job = (
      await client.query('SELECT * FROM jobs WHERE id=$1 AND workspace_id=$2 FOR UPDATE', [
        c.req.param('id'),
        c.get('workspace'),
      ])
    ).rows[0]
    assert(job)
    requirePermission(c, job.kind === 'delivery' ? 'send' : 'edit')
    assert(
      job.status === 'failed' && (job.kind === 'precheck' || job.mode === 'simulated'),
      409,
      2002,
      '此任务不能直接重试，请先核对外部处理结果',
    )
    await client.query("UPDATE jobs SET status='pending',error=NULL,updated_at=now() WHERE id=$1", [
      job.id,
    ])
    await client.query(
      "UPDATE outbox SET attempts=0,failed_at=NULL,error=NULL,available_at=now() WHERE topic='job' AND payload->>'id'=$1 AND delivered_at IS NULL",
      [job.id],
    )
    await record(client, c.get('workspace'), c.get('user').id, 'task.retry', job.id)
  })
  return c.json(ok(null), 202)
})
app.delete(`${prefix}/team/invitations/:id`, async (c) => {
  requirePermission(c, 'team')
  await transaction(async (client) => {
    assert(
      (
        await client.query(
          "UPDATE invitation SET status='canceled' WHERE id=$1 AND organization_id=$2 AND status='pending'",
          [c.req.param('id'), c.get('workspace')],
        )
      ).rowCount,
    )
    await record(client, c.get('workspace'), c.get('user').id, 'team.invitation.revoke')
  })
  return c.json(ok(null))
})
