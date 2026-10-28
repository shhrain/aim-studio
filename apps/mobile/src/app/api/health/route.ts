/** 健康检查（Docker HEALTHCHECK / 负载均衡探活） */
export function GET() {
  return Response.json({ status: 'ok', app: 'mobile', time: Date.now() })
}
