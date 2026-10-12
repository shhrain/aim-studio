import { builtinPlugin } from './builtin'
import { registerPlugin } from './registry'

registerPlugin(builtinPlugin)

export * from './assets'
export { builtinPlugin } from './builtin'
export * from './convert'
export * from './document'
export { createElement, type CreateElementOptions } from './elements/factory'
export { FlowBuilder, INNER, PAD, textHeight } from './layouts/flow'
export { parseRatio } from './layouts/blueprints'
export * from './precheck'
export {
  defineBlueprint,
  defineConverter,
  defineElement,
  definePlugin,
  defineRule,
  elementTexts,
  registerPlugin,
  registry,
  type ConverterPlugin,
  type ElementPlugin,
  type LayoutBlueprint,
  type LayoutBlueprintContext,
  type PrecheckRule,
  type TemplatePlugin,
} from './registry'
export * from './share'
