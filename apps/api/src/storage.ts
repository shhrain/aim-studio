import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { config } from './context'
const root = path.resolve(config.STORAGE_PATH)
const s3 =
  config.STORAGE_DRIVER === 's3'
    ? new S3Client({ region: config.S3_REGION, endpoint: config.S3_ENDPOINT, forcePathStyle: true })
    : null
function location(key: string) {
  if (!/^[a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+$/.test(key)) throw new Error('无效文件路径')
  const file = path.resolve(root, key)
  if (!file.startsWith(root + path.sep)) throw new Error('无效文件路径')
  return file
}
export const storage = {
  async size(key: string) {
    return s3
      ? Number(
          (await s3.send(new HeadObjectCommand({ Bucket: config.S3_BUCKET, Key: key })))
            .ContentLength,
        )
      : (await stat(location(key))).size
  },
  async stream(
    key: string,
    range?: { start: number; end: number },
  ): Promise<ReadableStream<Uint8Array>> {
    if (s3) {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: config.S3_BUCKET,
          Key: key,
          ...(range ? { Range: `bytes=${range.start}-${range.end}` } : {}),
        }),
      )
      if (!response.Body) throw new Error('文件内容不存在')
      return response.Body.transformToWebStream()
    }
    return Readable.toWeb(createReadStream(location(key), range)) as ReadableStream<Uint8Array>
  },
  async put(key: string, data: Buffer, mime: string) {
    if (s3) {
      await s3.send(
        new PutObjectCommand({ Bucket: config.S3_BUCKET, Key: key, Body: data, ContentType: mime }),
      )
      return
    }
    const file = location(key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, data, { flag: 'wx' })
  },
  async get(key: string) {
    if (s3) {
      const res = await s3.send(new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
      return Buffer.from(await res.Body!.transformToByteArray())
    }
    return readFile(location(key))
  },
  async delete(key: string) {
    if (s3) {
      await s3.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }))
      return
    }
    await unlink(location(key))
  },
}
