import { createExperienceApi, createHttpClient, type ExperienceTemplate } from '@aim/api-client'
import { TemplateThumbnail } from '@aim/template-preview'
import { Badge, Spinner } from '@aim/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'

/** 通过 msw-storybook-addon 复用 @aim/mock 接口：与移动端模板列表同源数据 */
const api = createExperienceApi(createHttpClient({ getToken: () => 'storybook' }))

const meta: Meta = { title: 'Data/体验模板列表（Mock 接口）', parameters: { layout: 'padded' } }
export default meta

export const TemplateList: StoryObj = {
  render: function Render() {
    const [list, setList] = useState<ExperienceTemplate[] | null>(null)
    useEffect(() => {
      void api.templateList({ pageIndex: 0, pageSize: 12 }).then((r) => setList(r.data))
    }, [])
    if (!list) return <Spinner label="请求 /rcs/aim-experience/api/v1/template/list …" />
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {list.map((t) => (
          <div key={t.tplId} className="overflow-hidden rounded-xl border bg-card">
            <div className="max-h-72 overflow-hidden bg-muted p-2">
              <TemplateThumbnail document={t.document} paramDisplay="example" />
            </div>
            <div className="space-y-1 p-3">
              <div className="text-sm font-medium">{t.tplName}</div>
              <div className="flex gap-1">
                <Badge variant="soft">{t.styleName}</Badge>
                {t.integrated && <Badge variant="success">三信融合</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  },
}
