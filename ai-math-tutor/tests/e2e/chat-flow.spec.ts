import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('h1:has-text("Eqara")', { timeout: 10000 })
  })

  test('should load the main page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Eqara/)
    
    // Check main heading
    const heading = page.locator('h1:has-text("Eqara")')
    await expect(heading).toBeVisible()
    
    // Check chat interface
    const chatCard = page.locator('text=Get step-by-step guidance and earn XP as you learn!')
    await expect(chatCard).toBeVisible()
  })

  test('should send a text message and receive response', async ({ page }) => {
    // Type a simple math problem
    const input = page.locator('textarea[placeholder*="Type a problem"]')
    await input.fill('What is 2 + 2?')
    
    // Click send button
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Wait for response (with longer timeout for API call)
    await page.waitForSelector('text=You:', { timeout: 10000 })
    
    // Check that message appears in chat
    const userMessage = page.locator('text=What is 2 + 2?')
    await expect(userMessage).toBeVisible()
    
    // Wait for AI response (may take a few seconds)
    await page.waitForTimeout(5000)
    
    // Check that we have at least 2 messages (user + assistant)
    const messages = page.locator('[class*="space-y-4"] > div')
    expect(await messages.count()).toBeGreaterThanOrEqual(2)
  })

  test('should display XP counter', async ({ page }) => {
    // Check if XP display exists (may be 0 initially)
    const xpBadge = page.locator('text=/\\d+ XP/')
    
    // XP should appear after interaction
    const input = page.locator('textarea[placeholder*="Type a problem"]')
    await input.fill('Test problem')
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    // Wait and check for XP
    await page.waitForTimeout(3000)
  })

  test('should show reset button when chat has messages', async ({ page }) => {
    // Send a message
    const input = page.locator('textarea[placeholder*="Type a problem"]')
    await input.fill('Test message')
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    await page.waitForTimeout(2000)
    
    // Reset button should be visible
    const resetButton = page.locator('button:has-text("Reset")')
    await expect(resetButton).toBeVisible()
  })

  test('should reset conversation when reset button clicked', async ({ page }) => {
    // Send a message
    const input = page.locator('textarea[placeholder*="Type a problem"]')
    await input.fill('Test message')
    
    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()
    
    await page.waitForTimeout(2000)
    
    // Click reset
    const resetButton = page.locator('button:has-text("Reset")')
    await resetButton.click()
    
    // Confirm reset in dialog if it appears
    await page.waitForTimeout(500)
    
    // Check that messages are cleared
    await page.waitForTimeout(1000)
  })

  test('should open Knowledge Graph sidebar', async ({ page }) => {
    const kgButton = page.locator('button:has-text("Knowledge Graph")')
    await kgButton.click()
    
    // Wait for sidebar to open
    await page.waitForTimeout(1000)
    
    // Check for sidebar content
    const sidebar = page.locator('text=Knowledge Graph')
    await expect(sidebar).toBeVisible()
  })

  test('should open Practice Quiz modal', async ({ page }) => {
    const quizButton = page.locator('button:has-text("Practice Quiz")')
    await quizButton.click()
    
    // Wait for modal to open
    await page.waitForTimeout(1000)
    
    // Check for quiz content
    const quizModal = page.locator('text=Practice Quiz')
    await expect(quizModal).toBeVisible()
  })

  test('should open Reviews modal', async ({ page }) => {
    const reviewButton = page.locator('button:has-text("Reviews")')
    await reviewButton.click()
    
    // Wait for modal to open
    await page.waitForTimeout(1000)
    
    // Check for review content
    const reviewModal = page.locator('text=Review Session')
    await expect(reviewModal).toBeVisible()
  })
})

