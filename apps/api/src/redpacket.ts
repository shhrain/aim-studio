import sharp, { type OverlayOptions } from 'sharp'
import type { IntegratedResult, TemplateDocument } from '@aim/template-schema'
import {
  REDPACKET_WIDTH,
  REDPACKET_HEIGHT,
  redpacketBackground,
  applyCapturedImage,
} from '@aim/template-core'
import type { PoolClient } from '@aim/db'
import { assert, config, id } from './context'
import { storage } from './storage'

const xml = (text: string) =>
  text.replace(
    /[<>&"']/g,
    (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]!,
  )

/** 将服务器可信的布局信息和当前版本文案合成为审核图，不访问任意远程地址。 */
export async function captureRedpacket(
  client: PoolClient,
  workspace: string,
  doc: TemplateDocument,
  converted: IntegratedResult,
) {
  const width = REDPACKET_WIDTH,
    height = REDPACKET_HEIGHT
  const background = Buffer.from(
    decodeURIComponent(redpacketBackground(width, height).split(',')[1]!),
  )
  const card = converted.sourceMaterial.content[0]
  assert(card?.overlay, 422, 1001, '红包缺少审核图布局，请重新选择版式')
  const texts = { name: card.avatartitle ?? '', title: card.title, description: card.description }
  const overlays: OverlayOptions[] = []
  for (const key of ['name', 'title', 'description'] as const) {
    const box = card.overlay[key]
    if (!box) continue
    const text = texts[key]
      .replace(/<[^>]*>/g, '')
      .replace(
        /\{#([^#]+)#\}/g,
        (_, name: string) => doc.params.find((p) => p.name === name)?.example ?? name,
      )
    const color = /^#[0-9a-f]{3,8}$/i.test(box.color) ? box.color : '#ffffff'
    const lines = text.match(
      new RegExp(`.{1,${Math.max(1, Math.floor(box.w / Math.max(10, box.fontSize)))}}`, 'gu'),
    ) ?? ['']
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="${box.x + box.w / 2}" y="${box.y + box.fontSize}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${box.fontSize}" fill="${color}">${lines
      .slice(0, 4)
      .map(
        (line, i) =>
          `<tspan x="${box.x + box.w / 2}" dy="${i ? box.fontSize * 1.4 : 0}">${xml(line)}</tspan>`,
      )
      .join('')}</text></svg>`
    overlays.push({ input: Buffer.from(svg) })
  }
  const avatar = card.media.avatarUrl?.match(/^\/api\/v1\/files\/([a-zA-Z0-9-]+)$/)?.[1]
  if (avatar && card.overlay.avatar) {
    const row = (
      await client.query(
        'SELECT key FROM materials WHERE id=$1 AND workspace_id=$2 FOR KEY SHARE',
        [avatar, workspace],
      )
    ).rows[0]
    assert(row, 400, 1001, '红包头像不属于当前工作空间')
    const box = card.overlay.avatar
    overlays.push({
      input: await sharp(await storage.get(row.key))
        .resize(Math.max(1, box.w), Math.max(1, box.h))
        .png()
        .toBuffer(),
      left: Math.max(0, box.x),
      top: Math.max(0, box.y),
    })
  }
  const image = await sharp(background).composite(overlays).png().toBuffer()
  const material = id(),
    key = `${workspace}/${material}.png`
  await storage.put(key, image, 'image/png')
  try {
    await client.query('SELECT id FROM organization WHERE id=$1 FOR UPDATE', [workspace])
    const used = (
      await client.query(
        'SELECT COALESCE(sum(size),0)::bigint size FROM materials WHERE workspace_id=$1',
        [workspace],
      )
    ).rows[0]
    assert(
      Number(used.size) + image.length <= config.WORKSPACE_STORAGE_BYTES,
      413,
      1001,
      '工作空间存储额度不足，无法生成审核图',
    )
    await client.query(
      "INSERT INTO materials(id,workspace_id,name,type,mime,key,size,metadata) VALUES($1,$2,$3,'image','image/png',$4,$5,$6)",
      [
        material,
        workspace,
        `${doc.name} 审核图`,
        key,
        image.length,
        JSON.stringify({ width, height, generated: true }),
      ],
    )
  } catch (error) {
    await storage.delete(key)
    throw error
  }
  return applyCapturedImage(converted, {
    rcsSrc: `/api/v1/files/${material}`,
    rmsSrc: `/api/v1/files/${material}`,
  })
}
