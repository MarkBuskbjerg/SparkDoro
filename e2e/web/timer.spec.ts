import { expect, test } from '@playwright/test'

test('timer start pause reset flow', async ({ page }) => {
  await page.goto('/timer')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()

  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
})

test('settings lock message on active work session', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByText('Stay focused - finish your session before changing settings.')).toBeVisible()
})

test('back button on settings navigates to timer', async ({ page }) => {
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/settings$/)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/timer$/)
})

test('preset deletion is guarded when only one preset exists', async ({ page }) => {
  await page.goto('/settings')

  const deleteButton = page.getByRole('button', { name: 'Delete preset' })
  await expect(deleteButton).toBeDisabled()
  await expect(page.getByText('At least one preset must remain.')).toBeVisible()

  await page.getByRole('button', { name: 'Add preset' }).click()
  const presetForm = page.locator('.preset-form')
  await expect(presetForm).toBeVisible()
  await presetForm.locator('ion-item').nth(0).locator('input').fill('Custom Workflow')
  await presetForm.locator('ion-item').nth(1).locator('input').fill('40')
  await presetForm.locator('ion-item').nth(2).locator('input').fill('8')
  await presetForm.locator('ion-item').nth(3).locator('input').fill('18')
  await presetForm.locator('ion-item').nth(4).locator('input').fill('3')
  await page.getByRole('button', { name: 'Save preset' }).click()
  await expect(deleteButton).toBeEnabled()

  await deleteButton.click()
  await expect(deleteButton).toBeDisabled()
  await expect(page.getByText('At least one preset must remain.')).toBeVisible()
})
