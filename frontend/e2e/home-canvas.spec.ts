import { test, expect } from '@playwright/test';

test.describe('HomeCanvas Guest Flow', () => {
  
  test('should login as special guest and interact with devices', async ({ page }) => {
    // 1. Navigate to Login
    await page.goto('http://localhost:5173/login');
    await expect(page).toHaveTitle(/HomeCanvas/);

    // 2. Click Special Guest Access
    const guestBtn = page.getByRole('button', { name: /Special Guest Access/i });
    await guestBtn.click();

    // 3. Verify Dashboard Redirection
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/Guest Mode Active/i)).toBeVisible();

    // 4. Verify Device Cards
    const deviceCards = page.locator('.hc-card');
    await expect(deviceCards).toHaveCountAtLeast(1);

    // 5. Navigate to Device Detail
    // Click the first device card that has "Fan" in the title
    const fanCard = page.locator('.hc-card', { hasText: /Fan/i }).first();
    await fanCard.click();

    // 6. Verify Detail Page
    await expect(page).toHaveURL(/.*\/device\/\d+/);
    await expect(page.getByText(/Smart Fan/i)).toBeVisible();

    // 7. Toggle Fan Command
    const fanToggle = page.getByRole('checkbox'); // Assuming it's a checkbox/switch
    await fanToggle.click();
    
    // Check for success feedback (toast or icon animation change)
    // For now we just verify the state change
    await expect(fanToggle).toBeChecked();
  });

});
