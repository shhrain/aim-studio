/** UTF-8 字节 → base64url（URL 安全，无填充） */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  void writer.write(bytes as Uint8Array<ArrayBuffer>)
  void writer.close()
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

const hasCompression = () => typeof CompressionStream !== 'undefined'

/**
 * JSON → 压缩后的 base64url 字符串（deflate-raw）。
 * 用于把模板放进二维码 / 分享链接，免后端也能跨设备预览。
 * 不支持 CompressionStream 的环境退化为未压缩（前缀 `u.`）。
 */
export async function encodeJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  if (!hasCompression()) return `u.${bytesToBase64Url(bytes)}`
  return `z.${bytesToBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`
}

export async function decodeJson<T = unknown>(input: string): Promise<T> {
  const [kind, payload = ''] = input.includes('.')
    ? (input.split('.', 2) as [string, string])
    : ['u', input]
  let bytes = base64UrlToBytes(payload)
  if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}
