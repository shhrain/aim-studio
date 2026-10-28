import type { SubmitRequest } from '@aim/api-contracts'
import { captureRedpacket } from './redpacket'
import { templateDocumentSchema, type TemplateDocument } from '@aim/template-schema'
import { convertDocument, getRcsFallbackTargets, precheck } from '@aim/template-core'
import sanitize from 'sanitize-html'
import { ALLOWED_TAGS } from '@aim/utils'
import type { PoolClient } from '@aim/db'
import { assert, id, record, transaction } from './context'

/** 服务端保存时净化富文本，保留已有格式与模板参数。 */
export function cleanDocument(input: unknown): TemplateDocument {
  const doc = templateDocumentSchema.parse(input)
  const walk = (v: unknown): unknown =>
    typeof v === 'string' && /<\/?[a-z]/i.test(v)
      ? sanitize(v, {
          allowedTags: ALLOWED_TAGS,
          allowedAttributes: { '*': ['style', 'color', 'data-param'] },
          allowedStyles: {
            '*': {
              color: [/^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s,.%]+\))$/i],
              'font-size': [/^\d+(px|em|rem|%)$/],
              'font-weight': [/^(bold|normal|[1-9]00)$/],
              'text-align': [/^(left|right|center)$/],
            },
          },
        })
      : Array.isArray(v)
        ? v.map(walk)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, value]) => [k, walk(value)]))
          : v
  return templateDocumentSchema.parse(walk(doc))
}
export async function references(
  client: PoolClient,
  workspace: string,
  template: string,
  doc: TemplateDocument,
  version?: string,
  converted?: unknown,
) {
  const files = [
    ...new Set(
      [
        ...JSON.stringify([doc.pages, converted]).matchAll(/\/api\/v1\/files\/([a-zA-Z0-9-]+)/g),
      ].map((m) => m[1]!),
    ),
  ]
  if (!version)
    await client.query(
      'DELETE FROM material_references WHERE workspace_id=$1 AND template_id=$2 AND version_id IS NULL',
      [workspace, template],
    )
  for (const material of files) {
    const found = await client.query(
      'SELECT id FROM materials WHERE id=$1 AND workspace_id=$2 FOR KEY SHARE',
      [material, workspace],
    )
    assert(found.rowCount, 400, 1001, '素材不存在或不属于当前工作空间')
    await client.query(
      'INSERT INTO material_references(id,workspace_id,material_id,template_id,version_id) VALUES($1,$2,$3,$4,$5)',
      [id(), workspace, material, template, version ?? null],
    )
  }
}
export function summary(row: Record<string, any>, full = true) {
  const d = row.document as TemplateDocument
  return {
    id: row.id,
    name: row.name,
    revision: row.revision,
    layoutId: d.layoutId,
    cardId: d.cardId,
    category: d.category,
    usage: d.usage,
    vendors: d.vendors,
    status: row.status,
    archived: row.archived,
    publishedVersionId: row.published_version_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    ...(full
      ? {
          document: {
            ...d,
            meta: {
              ...d.meta,
              status: row.status,
              createdAt: new Date(row.created_at).getTime(),
              updatedAt: new Date(row.updated_at).getTime(),
            },
          },
        }
      : {}),
  }
}
export async function saveTemplate(
  workspace: string,
  user: string,
  input: unknown,
  revision?: number,
  existingId?: string,
) {
  const doc = cleanDocument(input)
  return transaction(async (client) => {
    if (existingId) {
      const found = await client.query(
        'SELECT * FROM templates WHERE id=$1 AND workspace_id=$2 FOR UPDATE',
        [existingId, workspace],
      )
      const row = found.rows[0]
      assert(row)
      assert(row.revision === revision, 409, 2002, '模板已在其他页面更新，请重新加载或导出本地备份')
      assert(row.status !== 'reviewing', 409, 2002, '请先撤回审核再编辑')
      doc.id = existingId
      doc.meta = {
        ...doc.meta,
        status: 'draft',
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: Date.now(),
        rejectReason: undefined,
        submittedAt: undefined,
      }
      const result = await client.query(
        "UPDATE templates SET document=$1,name=$2,revision=revision+1,status='draft',updated_at=now() WHERE id=$3 AND workspace_id=$4 RETURNING *",
        [JSON.stringify(doc), doc.name, existingId, workspace],
      )
      await references(client, workspace, existingId, doc)
      await record(client, workspace, user, 'template.save', existingId)
      return summary(result.rows[0])
    }
    doc.meta = {
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      industry: doc.meta.industry,
    }
    const result = await client.query(
      'INSERT INTO templates(id,workspace_id,name,document,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [doc.id, workspace, doc.name, JSON.stringify(doc), user],
    )
    await references(client, workspace, doc.id, doc)
    await record(client, workspace, user, 'template.create', doc.id)
    return summary(result.rows[0])
  })
}
export async function submit(
  workspace: string,
  user: string,
  template: string,
  revision: number,
  options: Pick<SubmitRequest, 'rcsFallbacks'> = { rcsFallbacks: {} },
) {
  return transaction(async (client) => {
    const row = (
      await client.query('SELECT * FROM templates WHERE id=$1 AND workspace_id=$2 FOR UPDATE', [
        template,
        workspace,
      ])
    ).rows[0]
    assert(row)
    assert(
      row.revision === revision && row.status !== 'reviewing' && !row.archived,
      409,
      2002,
      '模板版本或状态已变更',
    )
    const doc = cleanDocument(row.document)
    const report = precheck(doc)
    assert(
      report.passed && !report.issues.some((i) => i.code.endsWith('.crash')),
      422,
      1001,
      report.errors[0]?.message ?? '预检规则执行失败，请稍后重试',
    )
    const targets = getRcsFallbackTargets(doc)
    assert(
      Object.keys(options.rcsFallbacks).every((key) =>
        targets.some((target) => target.elementId === key),
      ),
      422,
      1001,
      '替代链接对应的元素已变更，请重新打开审核面板',
    )
    assert(
      targets.every((target) => options.rcsFallbacks[target.elementId]),
      422,
      1001,
      '请补齐 RCS 不支持事件的 HTTPS 替代链接',
    )
    const version = id()
    let converted = convertDocument(doc, options)
    if (converted?.needCapture)
      converted = await captureRedpacket(client, workspace, doc, converted)
    await client.query(
      'INSERT INTO template_versions(id,workspace_id,template_id,revision,document,converted,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [
        version,
        workspace,
        template,
        revision,
        JSON.stringify(doc),
        JSON.stringify(converted),
        user,
      ],
    )
    await references(client, workspace, template, doc, version, converted)
    await client.query(
      'INSERT INTO reviews(id,workspace_id,template_id,version_id) VALUES($1,$2,$3,$4)',
      [id(), workspace, template, version],
    )
    const updated = await client.query(
      "UPDATE templates SET status='reviewing',updated_at=now() WHERE id=$1 RETURNING *",
      [template],
    )
    await record(client, workspace, user, 'template.submit', version)
    return summary(updated.rows[0])
  })
}
