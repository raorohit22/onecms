# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should allow a new user to sign up, login, and access dashboard
- Location: tests\e2e\auth.spec.ts:8:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/signup
Call log:
  - navigating to "http://localhost:5173/signup", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   // We'll use a random email to ensure fresh state for each run
  5  |   const userEmail = `testuser_${Date.now()}@example.com`;
  6  |   const password = 'Password123!';
  7  | 
  8  |   test('should allow a new user to sign up, login, and access dashboard', async ({ page }) => {
  9  |     // 1. Navigate to Sign Up
> 10 |     await page.goto('/signup');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/signup
  11 |     await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
  12 | 
  13 |     // 2. Fill out Sign Up Form
  14 |     await page.getByLabel(/first name/i).fill('E2E');
  15 |     await page.getByLabel(/last name/i).fill('Tester');
  16 |     await page.getByLabel(/email/i).fill(userEmail);
  17 |     await page.getByLabel(/password/i).fill(password);
  18 |     
  19 |     // Attempt submission
  20 |     await page.getByRole('button', { name: /sign up/i }).click();
  21 | 
  22 |     // 3. Expect redirection to login or auto-login
  23 |     // Assuming the app redirects to login with a success toast
  24 |     await expect(page).toHaveURL(/.*\/login/);
  25 | 
  26 |     // 4. Log In
  27 |     await page.getByLabel(/email/i).fill(userEmail);
  28 |     await page.getByLabel(/password/i).fill(password);
  29 |     await page.getByRole('button', { name: /log in/i }).click();
  30 | 
  31 |     // 5. Expect redirection to dashboard or workspace setup
  32 |     await expect(page).toHaveURL(/.*\/dashboard/);
  33 |     await expect(page.getByText('Dashboard')).toBeVisible();
  34 | 
  35 |     // 6. Test Logout
  36 |     // Locate the user dropdown/menu
  37 |     await page.getByRole('button', { name: /user menu/i }).click();
  38 |     await page.getByRole('menuitem', { name: /log out/i }).click();
  39 | 
  40 |     // Should be back on the login screen
  41 |     await expect(page).toHaveURL(/.*\/login/);
  42 |   });
  43 | });
  44 | 
```