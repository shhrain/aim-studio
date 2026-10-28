import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { BlockList, isIP } from 'node:net'
const blocked = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(network, prefix, 'ipv4')
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['::ffff:0:0', 96],
  ['2001:db8::', 32],
] as const)
  blocked.addSubnet(network, prefix, 'ipv6')
export function publicAddress(address: string) {
  const family = isIP(address)
  return family !== 0 && !blocked.check(address, family === 4 ? 'ipv4' : 'ipv6')
}
/** 固定已验证的 DNS 结果，逐次检查重定向，禁止访问私网及元数据地址。 */
export async function checkPublicLink(
  input: string,
  redirects = 0,
): Promise<{ url: string; reachable: boolean; https: boolean; status?: number; message: string }> {
  const url = new URL(input)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    redirects > 3
  )
    throw new Error('仅支持公网 HTTPS 链接')
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = await lookup(hostname, { all: true })
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new Error('不允许检测内部网络地址')
  const target = addresses[0]!
  const result = await new Promise<{ status: number; location?: string }>((resolve, reject) => {
    const req = request(
      url,
      {
        method: 'HEAD',
        timeout: 5000,
        lookup: ((_host: string, options: any, callback: any) =>
          options?.all
            ? callback(null, [target])
            : callback(null, target.address, target.family)) as any,
        headers: { 'User-Agent': 'AIM-Link-Check/1.0' },
      },
      (res) => {
        resolve({ status: res.statusCode ?? 0, location: res.headers.location })
        res.destroy()
      },
    )
    req.on('timeout', () => req.destroy(new Error('链接检测超时')))
    req.on('error', reject)
    req.end()
  })
  if (result.status >= 300 && result.status < 400 && result.location)
    return checkPublicLink(new URL(result.location, url).href, redirects + 1)
  return {
    url: input,
    reachable: result.status >= 200 && result.status < 400,
    https: true,
    status: result.status,
    message: result.status >= 200 && result.status < 400 ? '链接可达' : '链接返回非成功状态',
  }
}
