import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test("loads with Arabic RTL layout and main heading", async ({ page }) => {
    await page.goto("/")
    // RTL direction
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(page.locator("html")).toHaveAttribute("lang", "ar")
    // Main heading
    await expect(page.getByRole("heading", { name: "مرحباً بك في تطبيق طمأنينة" })).toBeVisible({ timeout: 15000 })
  })

  test("skip-to-content link appears on focus", async ({ page }) => {
    await page.goto("/")
    // The skip link is visually hidden but becomes visible on focus
    const skipLink = page.getByRole("link", { name: "تخطّي إلى المحتوى الرئيسي" })
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
  })

  test("main content has id for skip link target", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("#main-content")).toBeVisible()
  })
})

test.describe("Navigation", () => {
  test("can navigate to adhkar via bottom nav", async ({ page }) => {
    await page.goto("/")
    // Wait for splash to finish and content to load
    await page.waitForTimeout(3000)
    // Click the adhkar nav item
    const adhkarNav = page.getByRole("button", { name: "الأذكار" }).first()
    await adhkarNav.click()
    await page.waitForURL("**/?view=adhkar-list", { timeout: 10000 })
    // Should show adhkar cards
    await expect(page.getByText("الأذكار اليومية")).toBeVisible({ timeout: 10000 })
  })

  test("can navigate to prayer times via bottom nav", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(3000)
    const prayerNav = page.getByRole("button", { name: "الصلاة" }).first()
    await prayerNav.click()
    await page.waitForURL("**/?view=prayer-times", { timeout: 10000 })
    await expect(page.getByText("مواقيت الصلاة")).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Theme toggle", () => {
  test("can toggle dark mode", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(3000)
    // Find the theme toggle button
    const themeBtn = page.getByRole("button", { name: /تبديل إلى الوضع/ }).first()
    await themeBtn.click()
    // The html element should have the dark class
    await expect(page.locator("html")).toHaveClass(/dark/)
  })
})
