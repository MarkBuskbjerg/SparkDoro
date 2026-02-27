import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

function formatViolationTargets(targets: string[]): string {
  return targets.length > 0 ? targets.join(', ') : '<no target>'
}

export async function runAxeScan(page: Page, contextName: string): Promise<void> {
  const result = await new AxeBuilder({ page }).analyze()
  if (result.violations.length === 0) {
    return
  }

  const details = result.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node, index) => `  ${index + 1}. ${formatViolationTargets(node.target)}`)
        .join('\n')

      return [
        `- id: ${violation.id}`,
        `  impact: ${violation.impact ?? 'unknown'}`,
        `  targets:`,
        nodes || '  <no nodes>',
      ].join('\n')
    })
    .join('\n\n')

  expect(
    result.violations,
    `Axe violations found in "${contextName}".\n${details}`,
  ).toEqual([])
}
