import { expect, test, type Page } from '@playwright/test'
import { runAxeScan } from './support/axe'
import { pressTabAndAssertVisibleFocus } from './support/focusVisibility'

async function assertTabSequence(page: Page, sequenceName: string, steps: number): Promise<void> {
  for (let index = 1; index <= steps; index += 1) {
    await pressTabAndAssertVisibleFocus(page, `${sequenceName} tab ${index}`)
  }
}

test('@a11y axe: /timer idle', async ({ page }) => {
  await page.goto('/timer')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await runAxeScan(page, '/timer idle')
})

test('@a11y axe: /timer running', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await runAxeScan(page, '/timer running')
})

test('@a11y axe: /timer menu popover open', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
  await runAxeScan(page, '/timer menu popover open')
})

test('@a11y axe: focus-lock modal visible', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByText('Stay focused - finish your session before changing settings.')).toBeVisible()
  await runAxeScan(page, 'focus-lock modal visible')
})

test('@a11y axe: /settings default', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('Timer behavior')).toBeVisible()
  await runAxeScan(page, '/settings default')
})

test('@a11y axe: /settings preset form open', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Add preset' }).click()
  await expect(page.getByRole('button', { name: 'Save preset' })).toBeVisible()
  await runAxeScan(page, '/settings preset form open')
})

test('@a11y axe: /stats default', async ({ page }) => {
  await page.goto('/stats')
  await expect(page.getByText('Completed Pomodoros')).toBeVisible()
  await runAxeScan(page, '/stats default')
})

test('@a11y axe: /stats custom range', async ({ page }) => {
  await page.goto('/stats')
  await page.locator('ion-segment-button[value="custom"]').click({ force: true })
  await expect(page.getByText('Start date')).toBeVisible()
  await expect(page.getByText('End date')).toBeVisible()
  await runAxeScan(page, '/stats custom range')
})

test('@a11y axe: /about', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByText('SparkDoro is a local-first strict Pomodoro timer built for focused work.')).toBeVisible()
  await runAxeScan(page, '/about')
})

test('@a11y keyboard focus: /timer tab sequence', async ({ page }) => {
  await page.goto('/timer')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
  await assertTabSequence(page, '/timer', 5)
})

test('@a11y keyboard focus: menu popover tab sequence', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
  await assertTabSequence(page, 'menu popover', 4)
})

test('@a11y keyboard focus: /settings form controls', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('Timer behavior')).toBeVisible()
  await assertTabSequence(page, '/settings', 8)
})

test('@a11y keyboard focus: focus-lock modal action', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('button', { name: 'OK' })).toBeVisible()
  await assertTabSequence(page, 'focus-lock modal', 2)
})
