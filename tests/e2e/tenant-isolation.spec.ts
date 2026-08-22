import { test, expect } from '@playwright/test';

test.describe('Tenant Isolation Flow', () => {
  // This test assumes two different test users exist or are created.
  // In a robust E2E setup, we'd use a setup fixture to provision these.
  
  test('tenant users cannot access data across organizations', async ({ browser }) => {
    // We use two separate contexts to simulate two users logged in at the same time
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 1. Log in User A to Org A
    await pageA.goto('/login');
    await pageA.getByLabel(/email/i).fill('tenant_a@example.com');
    await pageA.getByLabel(/password/i).fill('Password123!');
    await pageA.getByRole('button', { name: /log in/i }).click();
    await expect(pageA).toHaveURL(/.*\/dashboard/);

    // 2. Log in User B to Org B
    await pageB.goto('/login');
    await pageB.getByLabel(/email/i).fill('tenant_b@example.com');
    await pageB.getByLabel(/password/i).fill('Password123!');
    await pageB.getByRole('button', { name: /log in/i }).click();
    await expect(pageB).toHaveURL(/.*\/dashboard/);

    // 3. User A creates a post
    await pageA.goto('/posts/new');
    await pageA.getByPlaceholder(/post title/i).fill('Tenant A Secret Post');
    await pageA.getByRole('button', { name: /save/i }).click();
    await expect(pageA.getByText('Post saved')).toBeVisible(); // assuming a toast

    // 4. User B checks their post list
    await pageB.goto('/posts');
    // User B should NOT see "Tenant A Secret Post"
    await expect(pageB.getByText('Tenant A Secret Post')).toBeHidden();

    // 5. User B tries to direct navigate to User A's post using the ID from the URL
    // (In reality we'd extract the ID from pageA's URL, but let's assume standard behavior returns 404/Not Found in UI)
    const urlA = pageA.url();
    const postIdMatch = urlA.match(/\/posts\/([a-zA-Z0-9_-]+)/);
    
    if (postIdMatch && postIdMatch[1]) {
      const postId = postIdMatch[1];
      await pageB.goto(`/posts/${postId}`);
      
      // Should show a 404 or access denied message
      await expect(pageB.getByText(/not found|access denied/i)).toBeVisible();
    }

    await contextA.close();
    await contextB.close();
  });
});
