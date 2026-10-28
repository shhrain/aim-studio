import { templateDocumentSchema, type TemplateDocument } from '@aim/template-schema'
import { platform } from '@/lib/platform'

export interface ImportOutcome {
  name: string
  success: boolean
  message?: string
  document: unknown
  materials?: LegacyBundle['materials']
}
interface LegacyBundle {
  templates?: Record<string, { document: unknown }>
  materials?: { id: string; url: string; name: string }[]
  document?: unknown
}

async function dataFile(source: string, name: string) {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]+)$/.exec(source)
  if (!match) throw new Error('素材数据格式错误，请重新上传')
  let blob = new Blob(
    [
      match[2]
        ? Uint8Array.from(atob(match[3]!), (ch) => ch.charCodeAt(0))
        : decodeURIComponent(match[3]!),
    ],
    { type: match[1] },
  )
  if (match[1] === 'image/svg+xml') {
    const image = new Image(),
      url = URL.createObjectURL(blob)
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('示例图片无法转换，请重新上传'))
        image.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(4096, image.naturalWidth || 342)
      canvas.height = Math.min(4096, image.naturalHeight || 200)
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('图片转换失败'))),
          'image/png',
        ),
      )
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  return new File(
    [blob],
    name.replace(/\.[^.]+$/, '') +
      (blob.type === 'image/png'
        ? '.png'
        : blob.type === 'image/jpeg'
          ? '.jpg'
          : blob.type === 'video/mp4'
            ? '.mp4'
            : '.bin'),
    { type: blob.type },
  )
}

/** 导入只产生当前空间草稿；逐素材上传，逐模板报告，不继承模拟审核或发送状态。 */
export async function importTemplates(
  api: string,
  input: unknown,
  onProgress: (message: string) => void,
): Promise<ImportOutcome[]> {
  const bundle = input as LegacyBundle
  const documents = Array.isArray(input)
    ? input
    : bundle.templates
      ? Object.values(bundle.templates).map((v) => v.document)
      : [bundle.document ?? input]
  const result: ImportOutcome[] = [],
    uploads = new Map<string, string>()
  for (const [index, value] of documents.entries()) {
    let doc: TemplateDocument | undefined
    try {
      doc = templateDocumentSchema.parse(value)
      doc.id = crypto.randomUUID()
      doc.meta = { createdAt: Date.now(), updatedAt: Date.now(), status: 'draft' }
      const migrate = async (value: unknown, key = ''): Promise<unknown> => {
        if (Array.isArray(value)) return Promise.all(value.map((item) => migrate(item, key)))
        if (value && typeof value === 'object')
          return Object.fromEntries(
            await Promise.all(
              Object.entries(value).map(async ([k, v]) => [k, await migrate(v, k)]),
            ),
          )
        if (
          typeof value !== 'string' ||
          !['src', 'cover', 'backgroundImage', 'avatarUrl', 'url'].includes(key) ||
          !value
        )
          return value
        const material = bundle.materials?.find((m) => m.id === value || m.url === value),
          source = material?.url ?? value
        if (source.startsWith('data:')) {
          if (!uploads.has(source)) {
            onProgress(`${index + 1}/${documents.length} · ${doc!.name}`)
            const form = new FormData()
            form.set('file', await dataFile(source, material?.name ?? doc!.name ?? 'material'))
            const uploaded = await platform.post<{ url: string }>(api + '/materials', form)
            uploads.set(source, uploaded.url)
          }
          return uploads.get(source)!
        }
        if (source.startsWith('blob:')) throw new Error('临时素材无法迁移，请重新选择原始文件')
        if (source.startsWith('/api/'))
          throw new Error('私有素材需要重新上传，不能继承其他工作空间的地址')
        return value
      }
      doc = templateDocumentSchema.parse(await migrate(doc))
      await platform.post(api + '/templates', doc)
      result.push({ name: doc.name, success: true, document: value })
    } catch (error) {
      result.push({
        name: doc?.name ?? String(index + 1),
        success: false,
        message: (error as Error).message,
        document: value,
        materials: bundle.materials,
      })
    }
  }
  return result
}

/** 只导出已存在的旧本地数据，不调用会自动生成示例的 Mock 初始化函数。 */
export async function readLegacyData(): Promise<unknown> {
  if (
    indexedDB.databases &&
    !(await indexedDB.databases()).some((db) => db.name === 'keyval-store')
  )
    throw new Error('当前浏览器没有旧本地数据')
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('keyval')) {
        db.close()
        reject(new Error('没有可导出的旧数据'))
        return
      }
      const read = db.transaction('keyval', 'readonly').objectStore('keyval').get('aim-mock-db')
      read.onsuccess = () => {
        db.close()
        if (read.result) resolve(read.result)
        else reject(new Error('没有可导出的旧数据'))
      }
      read.onerror = () => {
        db.close()
        reject(read.error)
      }
    }
  })
}
