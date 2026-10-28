import { saveCurrent } from './save'
import type { TemplateDocument, VendorId } from '@aim/template-schema'
import { platform, workspacePath } from '@/lib/platform'
/** 分享只使用服务端快照。 */
export async function createShareLink(
  doc: TemplateDocument,
  vendor: VendorId | string,
): Promise<string> {
  if (!(await saveCurrent())) throw new Error('请先保存模板，再创建分享')
  const result = await platform.post<{ url: string }>(workspacePath() + '/shares', {
    templateId: doc.id,
  })
  return result.url + '?vendor=' + encodeURIComponent(vendor)
}
