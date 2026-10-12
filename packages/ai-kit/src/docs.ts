import { LAYOUTS, LAYOUT_GROUPS, groupLayouts } from '@aim/template-schema'
import {
  actionsTable,
  elementsTable,
  layoutDetail,
  layoutsSummaryTable,
  paramTypesTable,
  vendorMatrix,
  vendorsTable,
} from './tables'

const HEADER = '{/* 本文件由 pnpm ai:generate 根据 @aim/template-schema 自动生成，请勿手改 */}'

function page(title: string, description: string, body: string, icon?: string) {
  return `---
title: ${title}
description: ${description}${icon ? `\nicon: ${icon}` : ''}
---

${HEADER}

${body}
`
}

/** 文档站「模板规范」章节（MDX） */
export function buildSpecDocs(): Record<string, string> {
  const groups = groupLayouts()
  const layouts = page(
    '版式',
    `${LAYOUTS.filter((l) => !l.free).length} 种标准版式与自由版式的槽位、字数限制、设置项与厂商支持。`,
    [
      '## 总览',
      '',
      layoutsSummaryTable({ compact: true }),
      '',
      ...groups.flatMap((g) => [
        `## ${LAYOUT_GROUPS[g.key].label}`,
        '',
        ...g.layouts.flatMap((l) => [layoutDetail(l), `<LayoutPreview layout="${l.id}" />`, '']),
      ]),
    ].join('\n'),
    'LayoutTemplate',
  )
  const elements = page(
    '元素',
    '32 种画布元素及其 props 字段。',
    [
      '元素数据结构见 [模板文档](/docs/spec/document)。props 字段的类型与默认值以 `elementPropsSchemas` 为准。',
      '',
      elementsTable(),
    ].join('\n'),
    'Shapes',
  )
  const actions = page(
    '点击事件',
    '15 种点击事件的字段、苹果端（RCS）与视频短信（RMS）兼容性。',
    [
      actionsTable(),
      '',
      '## 校验规则',
      '',
      '- 链接字段必须以 `https://` 开头，长度不超过 3000；',
      '- 电话字段允许数字、`*`、`+`、`-`、空格（3–20 位），可使用参数；',
      '- 日程的结束时间必须晚于开始时间；',
      '- 打开 APP / 快应用可配置兜底类型：应用市场、快应用、直接打开 H5、外部浏览器打开 H5。',
    ].join('\n'),
    'MousePointerClick',
  )
  const vendors = page(
    '厂商',
    '8 个手机厂商与各版式的支持矩阵。',
    ['## 厂商', '', vendorsTable(), '', '## 支持矩阵', '', vendorMatrix()].join('\n'),
    'Smartphone',
  )
  const params = page(
    '参数',
    '动态参数语法、类型与校验。',
    [
      '## 语法',
      '',
      '- 编辑器与文档内使用 `{#参数名#}`，例如 `尊敬的{#姓名#}`；',
      '- 导出 RCS / RMS 协议时转换为 `${参数名}`；',
      '- 参数名仅支持中英文、数字、下划线，最多 30 个字符；',
      '- 同名参数合并为一个定义。',
      '',
      '## 类型',
      '',
      paramTypesTable(),
      '',
      '## 校验',
      '',
      '- 文档中使用的参数必须已定义且有示例；',
      '- 示例长度需在最小 / 最大长度之间；',
      '- 字数校验按示例值替换后计算。',
    ].join('\n'),
    'Braces',
  )
  const meta = JSON.stringify(
    {
      title: '模板规范',
      pages: ['document', 'layouts', 'elements', 'actions', 'vendors', 'params'],
    },
    null,
    2,
  )
  return {
    'layouts.mdx': layouts,
    'elements.mdx': elements,
    'actions.mdx': actions,
    'vendors.mdx': vendors,
    'params.mdx': params,
    'meta.json': `${meta}\n`,
  }
}
