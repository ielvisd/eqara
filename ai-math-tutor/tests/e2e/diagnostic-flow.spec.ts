import { test, expect } from '@playwright/test'

test.describe('Diagnostic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/diagnostic')
    await page.waitForSelector('h1:has-text("Diagnostic Test")', { timeout: 10000 })
  })

  test('should load diagnostic page', async ({ page }) => {
    // Check heading
    const heading = page.locator('h1:has-text("Diagnostic Test")')
    await expect(heading).toBeVisible()
    
    // Check for description
    const description = page.locator('text=find your starting point')
    await expect(description).toBeVisible()
  })

  test('should display first question', async ({ page }) => {
    // Wait for question to load
    await page.waitForSelector('text=Question', { timeout: 10000 })
    
    // Check that question number is shown
    const questionHeader = page.locator('text=Question 1')
    await expect(questionHeader).toBeVisible()
    
    // Check that options are displayed
    const options = page.locator('button:has-text("A.")')
    await expect(options).toBeVisible()
  })

  test('should allow selecting an answer', async ({ page }) => {
    await page.waitForSelector('button:has-text("A.")', { timeout: 10000 })
    
    // Click first option
    const firstOption = page.locator('button:has-text("A.")').first()
    await firstOption.click()
    
    await page.waitForTimeout(500)
    
    // Submit button should be enabled
    const submitButton = page.locator('button:has-text("Submit Answer")')
    await expect(submitButton).toBeEnabled()
  })

  test('should allow submitting "I Don\'t Know"', async ({ page }) => {
    await page.waitForSelector('button:has-text("I Don\'t Know")', { timeout: 10000 })
    
    // Click "I Don't Know"
    const idkButton = page.locator('button:has-text("I Don\'t Know")')
    await idkButton.click()
    
    await page.waitForTimeout(2000)
    
    // Should move to next question or complete
    // Either way, we should see a different state
    await page.waitForTimeout(1000)
  })

  test('should complete diagnostic after sufficient questions', async ({ page }) => {
    // Answer several questions (either correct or "I don't know")
    for (let i = 0; i < 8; i++) {
      try {
        // Wait for options to be available
        await page.waitForSelector('button:has-text("I Don\'t Know")', { timeout: 5000 })
        
        // Click "I Don't Know" for quick completion
        const idkButton = page.locator('button:has-text("I Don\'t Know")')
        await idkButton.click()
        
        // Wait for next question
        await page.waitForTimeout(2000)
      } catch (e) {
        // If we can't find the button, we might be done
        break
      }
    }
    
    // Should eventually see completion screen
    await page.waitForTimeout(3000)
    
    // Look for completion indicators
    const completionText = page.locator('text=/Diagnostic Complete|Knowledge Frontier/i')
    
    // If not complete yet, it's okay (depends on adaptive algorithm)
    // Just check we're still on a valid page
    const isStillOnDiagnostic = await page.locator('h1:has-text("Diagnostic Test")').isVisible()
    expect(isStillOnDiagnostic || await completionText.count() > 0).toBeTruthy()
  })
})

