import sharp from 'sharp'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { BusinessError } from './context'
const exec = promisify(execFile)
/** 只处理受限的本地临时文件，禁止媒体解析器访问远程协议。 */
export async function inspectMedia(
  data: Buffer,
  mime: string,
): Promise<{ width?: number; height?: number; duration?: number }> {
  if (mime.startsWith('image/')) {
    try {
      const image = sharp(data, { limitInputPixels: 40_000_000, failOn: 'warning' })
      const meta = await image.metadata()
      await image.resize(1, 1).png().toBuffer()
      return { width: meta.width, height: meta.height }
    } catch {
      throw new BusinessError(400, 1001, '图片损坏或像素尺寸过大，请重新导出后上传')
    }
  }
  const directory = await mkdtemp(join(tmpdir(), 'aim-media-'))
  try {
    const file = join(directory, 'input')
    await writeFile(file, data)
    const { stdout } = await exec(
      process.env.FFPROBE_PATH || 'ffprobe',
      [
        '-v',
        'error',
        '-protocol_whitelist',
        'file,pipe',
        '-show_entries',
        'format=duration:stream=codec_type,width,height',
        '-of',
        'json',
        file,
      ],
      { timeout: 10000, maxBuffer: 1024 * 1024, windowsHide: true },
    )
    const result = JSON.parse(stdout)
    const stream = result.streams?.find(
      (s: { codec_type: string }) => s.codec_type === mime.split('/')[0],
    )
    const duration = Number(result.format?.duration)
    if (!stream || !Number.isFinite(duration) || duration <= 0 || duration > 3600)
      throw new Error('无效媒体')
    return {
      ...(mime.startsWith('video/') ? { width: stream.width, height: stream.height } : {}),
      duration,
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new BusinessError(503, 3001, '媒体检查器未安装，请配置 FFPROBE_PATH 后重试')
    throw new BusinessError(400, 1001, '媒体损坏、时长超限或解析超时，请重新导出后上传')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
