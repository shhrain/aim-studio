type Area = 'local' | 'session'

function area(kind: Area): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

/** 带 JSON 序列化与异常保护的 Web Storage 访问器（隐私模式 / SSR 下安全降级） */
export function createStorage(kind: Area = 'local', prefix = 'aim:') {
  return {
    get<T>(key: string, fallback: T): T {
      const raw = area(kind)?.getItem(prefix + key)
      if (raw == null) return fallback
      try {
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    set(key: string, value: unknown) {
      try {
        area(kind)?.setItem(prefix + key, JSON.stringify(value))
      } catch {
        /* 配额满或隐私模式：忽略 */
      }
    },
    remove(key: string) {
      area(kind)?.removeItem(prefix + key)
    },
  }
}

export const local = createStorage('local')
export const session = createStorage('session')
