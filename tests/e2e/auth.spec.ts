import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // We'll use a random email to ensure fresh state for each run
  const userEmail = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  test('should allow a new user to sign up, login, and access dashboard', async ({ page }) => {
    // 1. Navigate to Sign Up
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    // 2. Fill out Sign Up Form
    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Tester');
    await page.getByLabel(/email/i).fill(userEmail);
    await page.getByLabel(/password/i).fill(password);
    
    // Attempt submission
    await page.getByRole('button', { name: /sign up/i }).click();

    // 3. Expect redirection to login or auto-login
    // Assuming the app redirects to login with a success toast
    await expect(page).toHaveURL(/.*\/login/);

    // 4. Log In
    await page.getByLabel(/email/i).fill(userEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in/i }).click();

    // 5. Expect redirection to dashboard or workspace setup
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();

    // 6. Test Logout
    // Locate the user dropdown/menu
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();

    // Should be back on the login screen
    await expect(page).toHaveURL(/.*\/login/);
  });
});
