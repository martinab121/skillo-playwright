import { test, expect } from '@playwright/test';

test.describe('ISkillo - first steps', () => {
  test('home page opens', async ({ page }) => {
    await page.goto('/posts/all');
    await expect(page).toHaveTitle('ISkillo');
    await expect(page.locator('#nav-link-home')).toBeVisible();
  });

  test('login link opens the login form', async ({ page }) => {
    await page.goto('/posts/all');
    await page.locator('#nav-link-login').click();
    await expect(page).toHaveURL(/\/users\/login/);
    await expect(page.getByPlaceholder('Username or email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('wrong credentials keep you on the login page', async ({ page }) => {
    await page.goto('/users/login');
    await page.getByPlaceholder('Username or email').fill('no-such-user-123');
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/users\/login/);
  });
});
