import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { IntegratedDemo, LayoutPreview, MultiVendorDemo, PreviewPlayground } from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    Accordion,
    Accordions,
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
