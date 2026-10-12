'use client'

import type { TemplateDocument } from '@aim/template-schema'
import { createRoot, type Root } from 'react-dom/client'
import { TemplatePreview, type TemplatePreviewProps } from '../TemplatePreview'

const ATTRS = [
  'vendor',
  'mode',
  'protocol',
  'width',
  'param-display',
  'interactive',
  'theme',
  'chatbot-name',
  'src',
  'stylesheet',
] as const

/**
 * Web Component：<aim-preview>
 * - 属性：vendor / mode / protocol / width / param-display / interactive / theme / chatbot-name
 * - src：模板 JSON 地址（可选）；stylesheet：样式地址（启用 Shadow DOM 隔离时必填）
 * - JS 属性：element.document = TemplateDocument；element.params = { name: '张三' }
 * - 事件：aim-action（detail 为点击事件）
 *
 * @example
 * import { defineAimPreviewElement } from '@aim/template-preview/element'
 * defineAimPreviewElement()
 * <aim-preview vendor="vivo" mode="phone"></aim-preview>
 */
export function defineAimPreviewElement(tagName = 'aim-preview') {
  if (typeof window === 'undefined' || customElements.get(tagName)) return

  class AimPreviewElement extends HTMLElement {
    static get observedAttributes() {
      return ATTRS as unknown as string[]
    }
    #root: Root | null = null
    #mount: HTMLElement | null = null
    #document: TemplateDocument | undefined
    #params: Record<string, string> | undefined

    set document(value: TemplateDocument | undefined) {
      this.#document = value
      this.#render()
    }
    get document() {
      return this.#document
    }
    set params(value: Record<string, string> | undefined) {
      this.#params = value
      this.#render()
    }

    connectedCallback() {
      const stylesheet = this.getAttribute('stylesheet')
      const host: ShadowRoot | HTMLElement = stylesheet ? this.attachShadow({ mode: 'open' }) : this
      if (stylesheet) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = stylesheet
        host.appendChild(link)
      }
      this.#mount = document.createElement('div')
      host.appendChild(this.#mount)
      this.#root = createRoot(this.#mount)
      void this.#load()
      this.#render()
    }

    disconnectedCallback() {
      this.#root?.unmount()
      this.#root = null
    }

    attributeChangedCallback(name: string) {
      if (name === 'src') void this.#load()
      else this.#render()
    }

    async #load() {
      const src = this.getAttribute('src')
      if (!src) return
      try {
        this.#document = (await (await fetch(src)).json()) as TemplateDocument
        this.#render()
      } catch (err) {
        this.dispatchEvent(new CustomEvent('aim-error', { detail: err }))
      }
    }

    #render() {
      if (!this.#root) return
      const attr = (n: string) => this.getAttribute(n) ?? undefined
      const width = attr('width')
      const props: TemplatePreviewProps = {
        document: this.#document,
        params: this.#params,
        vendor: attr('vendor'),
        mode: attr('mode') as TemplatePreviewProps['mode'],
        protocol: attr('protocol') as TemplatePreviewProps['protocol'],
        width: width && /^\d+$/.test(width) ? Number(width) : width,
        paramDisplay: attr('param-display') as TemplatePreviewProps['paramDisplay'],
        interactive: (attr('interactive') as TemplatePreviewProps['interactive']) ?? 'native',
        theme: attr('theme') as TemplatePreviewProps['theme'],
        chatbotName: attr('chatbot-name'),
        onAction: (e) =>
          this.dispatchEvent(
            new CustomEvent('aim-action', { detail: e, bubbles: true, composed: true }),
          ),
      }
      this.#root.render(<TemplatePreview {...props} />)
    }
  }

  customElements.define(tagName, AimPreviewElement)
}
