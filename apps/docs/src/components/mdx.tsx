import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { IntegratedDemo, LayoutPreview, MultiVendorDemo, PreviewPlayground } from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    LayoutPreview,
    PreviewPlayground,
    MultiVendorDemo,
    IntegratedDemo,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
