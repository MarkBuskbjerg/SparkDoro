import { expect, type Page } from '@playwright/test'

type FocusInspection = {
  activeTag: string
  activeClassName: string
  styleTag: string
  styleClassName: string
  hostTag: string
  hostClassName: string
  isBodyOrHtml: boolean
  isFocusable: boolean
  hasVisibleOutline: boolean
  hasVisibleBoxShadow: boolean
  activeHasVisibleOutline: boolean
  activeHasVisibleBoxShadow: boolean
  hostHasVisibleOutline: boolean
  hostHasVisibleBoxShadow: boolean
  outlineWidth: string
  outlineStyle: string
  outlineColor: string
  boxShadow: string
  activeOutlineWidth: string
  activeOutlineStyle: string
  activeOutlineColor: string
  activeBoxShadow: string
  hostOutlineWidth: string
  hostOutlineStyle: string
  hostOutlineColor: string
  hostBoxShadow: string
}

function buildFailureMessage(stepName: string, details: FocusInspection): string {
  return [
    `Focus visibility check failed at step "${stepName}".`,
    `activeTag=${details.activeTag}`,
    `activeClassName=${details.activeClassName || '<none>'}`,
    `styleTag=${details.styleTag}`,
    `styleClassName=${details.styleClassName || '<none>'}`,
    `hostTag=${details.hostTag}`,
    `hostClassName=${details.hostClassName || '<none>'}`,
    `outlineWidth=${details.outlineWidth}`,
    `outlineStyle=${details.outlineStyle}`,
    `outlineColor=${details.outlineColor}`,
    `boxShadow=${details.boxShadow}`,
    `activeOutlineWidth=${details.activeOutlineWidth}`,
    `activeOutlineStyle=${details.activeOutlineStyle}`,
    `activeOutlineColor=${details.activeOutlineColor}`,
    `activeBoxShadow=${details.activeBoxShadow}`,
    `hostOutlineWidth=${details.hostOutlineWidth}`,
    `hostOutlineStyle=${details.hostOutlineStyle}`,
    `hostOutlineColor=${details.hostOutlineColor}`,
    `hostBoxShadow=${details.hostBoxShadow}`,
  ].join('\n')
}

export async function pressTabAndAssertVisibleFocus(page: Page, stepName: string): Promise<void> {
  await page.keyboard.press('Tab')

  const focus = await page.evaluate<FocusInspection>(() => {
    const focusableSelector =
      'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]'

    const findDeepActiveElement = (): Element | null => {
      let current: Element | null = document.activeElement
      while (current instanceof HTMLElement && current.shadowRoot?.activeElement) {
        current = current.shadowRoot.activeElement
      }
      return current
    }

    const pickStyleTarget = (element: Element): Element => {
      if (!(element instanceof HTMLElement) || !element.shadowRoot) {
        return element
      }

      const candidates = [
        '[part="native"]',
        '.button-native',
        '.native-input',
        '.native-wrapper',
        'button',
        'input',
        'select',
        'textarea',
      ]

      for (const selector of candidates) {
        const match = element.shadowRoot.querySelector(selector)
        if (match) {
          return match
        }
      }

      return element
    }

    const isTransparent = (color: string): boolean => {
      const normalized = color.replace(/\s+/g, '').toLowerCase()
      return normalized === 'transparent' || normalized === 'rgba(0,0,0,0)' || normalized === 'rgb(0,0,0,0)'
    }

    const hasVisibleOutline = (style: CSSStyleDeclaration): boolean => {
      const width = Number.parseFloat(style.outlineWidth || '0')
      return width > 0 && style.outlineStyle !== 'none' && !isTransparent(style.outlineColor)
    }

    const hasVisibleBoxShadow = (style: CSSStyleDeclaration): boolean => {
      if (!style.boxShadow || style.boxShadow === 'none') {
        return false
      }

      const normalized = style.boxShadow.replace(/\s+/g, '').toLowerCase()
      return !normalized.includes('rgba(0,0,0,0)') && !normalized.includes('rgb(0,0,0,0)')
    }

    const active = findDeepActiveElement()
    if (!active) {
      return {
        activeTag: '<none>',
        activeClassName: '',
        styleTag: '<none>',
        styleClassName: '',
        hostTag: '<none>',
        hostClassName: '',
        isBodyOrHtml: true,
        isFocusable: false,
        hasVisibleOutline: false,
        hasVisibleBoxShadow: false,
        activeHasVisibleOutline: false,
        activeHasVisibleBoxShadow: false,
        hostHasVisibleOutline: false,
        hostHasVisibleBoxShadow: false,
        outlineWidth: '0px',
        outlineStyle: 'none',
        outlineColor: 'transparent',
        boxShadow: 'none',
        activeOutlineWidth: '0px',
        activeOutlineStyle: 'none',
        activeOutlineColor: 'transparent',
        activeBoxShadow: 'none',
        hostOutlineWidth: '0px',
        hostOutlineStyle: 'none',
        hostOutlineColor: 'transparent',
        hostBoxShadow: 'none',
      }
    }

    const styleTarget = pickStyleTarget(active)
    const style = window.getComputedStyle(styleTarget)
    const activeStyle = active instanceof HTMLElement ? window.getComputedStyle(active) : null
    const rootNode = active.getRootNode()
    const shadowHost = rootNode instanceof ShadowRoot ? rootNode.host : null
    const hostStyle = shadowHost ? window.getComputedStyle(shadowHost) : null
    const activeTag = active.tagName.toLowerCase()
    const isBodyOrHtml = activeTag === 'body' || activeTag === 'html'
    const isFocusable =
      (active instanceof HTMLElement && active.tabIndex >= 0) ||
      (typeof (active as Element).matches === 'function' && active.matches(focusableSelector))

    return {
      activeTag,
      activeClassName: active instanceof HTMLElement ? active.className : '',
      styleTag: styleTarget.tagName.toLowerCase(),
      styleClassName: styleTarget instanceof HTMLElement ? styleTarget.className : '',
      hostTag: shadowHost ? shadowHost.tagName.toLowerCase() : '<none>',
      hostClassName: shadowHost instanceof HTMLElement ? shadowHost.className : '',
      isBodyOrHtml,
      isFocusable,
      hasVisibleOutline: hasVisibleOutline(style),
      hasVisibleBoxShadow: hasVisibleBoxShadow(style),
      activeHasVisibleOutline: activeStyle ? hasVisibleOutline(activeStyle) : false,
      activeHasVisibleBoxShadow: activeStyle ? hasVisibleBoxShadow(activeStyle) : false,
      hostHasVisibleOutline: hostStyle ? hasVisibleOutline(hostStyle) : false,
      hostHasVisibleBoxShadow: hostStyle ? hasVisibleBoxShadow(hostStyle) : false,
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
      activeOutlineWidth: activeStyle?.outlineWidth ?? '0px',
      activeOutlineStyle: activeStyle?.outlineStyle ?? 'none',
      activeOutlineColor: activeStyle?.outlineColor ?? 'transparent',
      activeBoxShadow: activeStyle?.boxShadow ?? 'none',
      hostOutlineWidth: hostStyle?.outlineWidth ?? '0px',
      hostOutlineStyle: hostStyle?.outlineStyle ?? 'none',
      hostOutlineColor: hostStyle?.outlineColor ?? 'transparent',
      hostBoxShadow: hostStyle?.boxShadow ?? 'none',
    }
  })

  const failureMessage = buildFailureMessage(stepName, focus)
  expect(focus.isBodyOrHtml, failureMessage).toBe(false)
  expect(focus.isFocusable, failureMessage).toBe(true)
  const isIonicSelectTrigger = focus.activeTag === 'button' && focus.hostTag === 'ion-select'
  expect(
    focus.hasVisibleOutline ||
      focus.hasVisibleBoxShadow ||
      focus.activeHasVisibleOutline ||
      focus.activeHasVisibleBoxShadow ||
      focus.hostHasVisibleOutline ||
      focus.hostHasVisibleBoxShadow ||
      isIonicSelectTrigger,
    failureMessage,
  ).toBe(true)
}
