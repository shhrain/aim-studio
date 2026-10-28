import { BusinessError, config } from './context'
/** 外部服务适配器的公共结果必须声明运行模式。 */
export interface ProviderResult<T> {
  mode: 'simulated' | 'live'
  data: T
}
export interface DeliveryProvider {
  send(input: {
    requestId: string
    mobiles: string[]
  }): Promise<ProviderResult<{ accepted: string[] }>>
}
export interface AbilityProvider {
  query(
    mobiles: string[],
  ): Promise<
    ProviderResult<
      { mobile: string; receiveState: 0 | 1; factory?: string; carrier?: string; rcs: boolean }[]
    >
  >
}
export interface CopyProvider {
  generate(prompt: string, maxLength: number): Promise<ProviderResult<string[]>>
}
const unavailable = (): never => {
  throw new BusinessError(503, 3001, '外部通道尚未配置')
}
/** 生产禁止模拟；接入真实供应商时实现此接口并添加回执验签，不改动业务状态流。 */
export const providers: {
  delivery: DeliveryProvider
  ability: AbilityProvider
  copy: CopyProvider
} =
  config.PROVIDER_MODE === 'simulated'
    ? {
        delivery: {
          async send({ mobiles }) {
            return { mode: 'simulated', data: { accepted: mobiles } }
          },
        },
        ability: {
          async query(mobiles) {
            return {
              mode: 'simulated',
              data: mobiles.map((mobile) => ({
                mobile,
                receiveState: 1,
                factory: 'huawei',
                carrier: '模拟通道',
                rcs: true,
              })),
            }
          },
        },
        copy: {
          async generate(prompt, maxLength) {
            return {
              mode: 'simulated',
              data: [`${prompt}，立即了解`, `${prompt}，为您精选`].map((s) =>
                s.slice(0, maxLength),
              ),
            }
          },
        },
      }
    : {
        delivery: { send: async () => unavailable() },
        ability: { query: async () => unavailable() },
        copy: { generate: async () => unavailable() },
      }
