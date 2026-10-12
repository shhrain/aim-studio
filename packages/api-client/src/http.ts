/** 统一响应：只认 subCode，0 为成功 */
export interface ApiResponse<T> {
  subCode: number
  message: string
  data: T
  pageInfo?: PageInfo
}

export interface PageInfo {
  total: number
  pageIndex: number
  pageSize: number
}

export interface Paged<T> {
  list: T[]
  pageInfo: PageInfo
}

/** 业务错误码 */
export const SUB_CODE = {
  OK: 0,
  PARAM: 1001,
  CAPTCHA: 1002,
  RATE_LIMIT: 1003,
  NOT_FOUND: 2001,
  DUPLICATE: 2002,
  UPSTREAM: 3001,
  UPSTREAM_TIMEOUT: 3002,
  SYSTEM: 5000,
  UNAUTHORIZED: 9001,
} as const

export const SUB_CODE_MESSAGE: Record<number, string> = {
  1001: '参数错误',
  1002: '验证码错误',
  1003: '操作过于频繁，请稍后再试',
  2001: '数据不存在',
  2002: '数据已存在',
  3001: '上游服务异常',
  3002: '上游服务超时',
  5000: '系统繁忙，请稍后再试',
  9001: '登录已失效，请重新进入',
}

export class ApiError extends Error {
  readonly subCode: number
  readonly status: number
  readonly path: string
  constructor(subCode: number, message: string, path: string, status = 200) {
    super(message || SUB_CODE_MESSAGE[subCode] || '请求失败')
    this.name = 'ApiError'
    this.subCode = subCode
    this.status = status
    this.path = path
  }
  get isUnauthorized() {
    return this.subCode === SUB_CODE.UNAUTHORIZED
  }
}

export interface HttpClientOptions {
  /** 接口根地址，默认同源 */
  baseUrl?: string
  /** 鉴权 token（请求头 AuthorizationCode） */
  getToken?: () => string | null | undefined
  /** 登录失效回调（subCode 9001） */
  onUnauthorized?: (error: ApiError) => void
  /** 全局错误回调（用于 toast） */
  onError?: (error: ApiError) => void
  timeout?: number
  fetch?: typeof fetch
  headers?: Record<string, string>
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  signal?: AbortSignal
  /** 返回完整响应（含 pageInfo） */
  raw?: boolean
  /** 不触发全局 onError（调用方自行处理） */
  silent?: boolean
  /** 期望二进制（图片验证码等） */
  responseType?: 'json' | 'blob'
}

export type HttpClient = ReturnType<typeof createHttpClient>

/** 创建请求客户端：处理鉴权头、超时、subCode 判定与统一错误 */
export function createHttpClient(options: HttpClientOptions = {}) {
  const doFetch =
    options.fetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args))
  const timeout = options.timeout ?? 20_000

  function buildUrl(path: string, query?: RequestOptions['query']) {
    const base = options.baseUrl ?? ''
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query ?? {}))
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    const s = qs.toString()
    return `${base}${path}${s ? `?${s}` : ''}`
  }

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    opts.signal?.addEventListener('abort', () => controller.abort())
    const token = options.getToken?.()
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.AuthorizationCode = token
    let res: Response
    try {
      res = await doFetch(buildUrl(path, opts.query), {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: controller.signal,
      })
    } catch (err) {
      const aborted = (err as Error).name === 'AbortError'
      throw fail(
        new ApiError(
          SUB_CODE.SYSTEM,
          aborted ? '请求超时，请检查网络后重试' : '网络异常，请检查网络后重试',
          path,
          0,
        ),
        opts,
      )
    } finally {
      clearTimeout(timer)
    }
    if (opts.responseType === 'blob') {
      if (!res.ok)
        throw fail(
          new ApiError(SUB_CODE.SYSTEM, `请求失败（${res.status}）`, path, res.status),
          opts,
        )
      return (await res.blob()) as T
    }
    let json: ApiResponse<T>
    try {
      json = (await res.json()) as ApiResponse<T>
    } catch {
      throw fail(
        new ApiError(SUB_CODE.SYSTEM, `服务响应异常（${res.status}）`, path, res.status),
        opts,
      )
    }
    if (json.subCode !== SUB_CODE.OK)
      throw fail(new ApiError(json.subCode, json.message, path, res.status), opts)
    return (opts.raw ? json : json.data) as T
  }

  function fail(error: ApiError, opts: RequestOptions) {
    if (error.isUnauthorized) options.onUnauthorized?.(error)
    else if (!opts.silent) options.onError?.(error)
    return error
  }

  return {
    request,
    get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('POST', path, { ...opts, body }),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('PUT', path, { ...opts, body }),
    del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
    url: buildUrl,
  }
}
