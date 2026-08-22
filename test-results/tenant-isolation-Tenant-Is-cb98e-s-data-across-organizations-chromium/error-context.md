# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-isolation.spec.ts >> Tenant Isolation Flow >> tenant users cannot access data across organizations
- Location: tests\e2e\tenant-isolation.spec.ts:7:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

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
  3  | test.describe('Tenant Isolation Flow', () => {
  4  |   // This test assumes two different test users exist or are created.
  5  |   // In a robust E2E setup, we'd use a setup fixture to provision these.
  6  |   
  7  |   test('tenant users cannot access data across organizations', async ({ browser }) => {
  8  |     // We use two separate contexts to simulate two users logged in at the same time
  9  |     const contextA = await browser.newContext();
  10 |     const contextB = await browser.newContext();
  11 | 
  12 |     const pageA = await contextA.newPage();
  13 |     const pageB = await contextB.newPage();
  14 | 
  15 |     // 1. Log in User A to Org A
> 16 |     await pageA.goto('/login');
     |                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  17 |     await pageA.getByLabel(/email/i).fill('tenant_a@example.com');
  18 |     await pageA.getByLabel(/password/i).fill('Password123!');
  19 |     await pageA.getByRole('button', { name: /log in/i }).click();
  20 |     await expect(pageA).toHaveURL(/.*\/dashboard/);
  21 | 
  22 |     // 2. Log in User B to Org B
  23 |     await pageB.goto('/login');
  24 |     await pageB.getByLabel(/email/i).fill('tenant_b@example.com');
  25 |     await pageB.getByLabel(/password/i).fill('Password123!');
  26 |     await pageB.getByRole('button', { name: /log in/i }).click();
  27 |     await expect(pageB).toHaveURL(/.*\/dashboard/);
  28 | 
  29 |     // 3. User A creates a post
  30 |     await pageA.goto('/posts/new');
  31 |     await pageA.getByPlaceholder(/post title/i).fill('Tenant A Secret Post');
  32 |     await pageA.getByRole('button', { name: /save/i }).click();
  33 |     await expect(pageA.getByText('Post saved')).toBeVisible(); // assuming a toast
  34 | 
  35 |     // 4. User B checks their post list
  36 |     await pageB.goto('/posts');
  37 |     // User B should NOT see "Tenant A Secret Post"
  38 |     await expect(pageB.getByText('Tenant A Secret Post')).toBeHidden();
  39 | 
  40 |     // 5. User B tries to direct navigate to User A's post using the ID from the URL
  41 |     // (In reality we'd extract the ID from pageA's URL, but let's assume standard behavior returns 404/Not Found in UI)
  42 |     const urlA = pageA.url();
  43 |     const postIdMatch = urlA.match(/\/posts\/([a-zA-Z0-9_-]+)/);
  44 |     
  45 |     if (postIdMatch && postIdMatch[1]) {
  46 |       const postId = postIdMatch[1];
  47 |       await pageB.goto(`/posts/${postId}`);
  48 |       
  49 |       // Should show a 404 or access denied message
  50 |       await expect(pageB.getByText(/not found|access denied/i)).toBeVisible();
  51 |     }
  52 | 
  53 |     await contextA.close();
  54 |     await contextB.close();
  55 |   });
  56 | });
  57 | 
```