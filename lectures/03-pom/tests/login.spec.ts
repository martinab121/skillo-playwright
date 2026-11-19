import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('LoginPage page object', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		await loginPage.navigate();
	});

	test('signs in and keeps the account open after a reload', async ({ page }) => {
		const accountPage = await loginPage.loginAndOpenAccount('sam@example.test', 'demo-password');

		await expect(page).toHaveURL(/\/index\.html$/);
		await expect(accountPage.welcomeMessage).toHaveText('Welcome back, Sam.');
		await expect(accountPage.email).toHaveText('sam@example.test');

		await page.reload();

		await expect(accountPage.welcomeMessage).toHaveText('Welcome back, Sam.');
	});

	test('shows an error for invalid credentials', async ({ page }) => {
		await loginPage.login('wrong@example.test', 'wrong-password');

		await expect(loginPage.errorMessage).toHaveText('Email or password is incorrect.');
		await expect(page).toHaveURL(/\/login\.html$/);
	});

	test('shows an error when the form is empty', async () => {
		await loginPage.submitButton.click();

		await expect(loginPage.errorMessage).toHaveText('Enter your email address and password.');
		await expect(loginPage.email).toBeFocused();
	});

	test('shows an error for a malformed email address', async () => {
		await loginPage.login('not-an-email', 'demo-password');

		await expect(loginPage.errorMessage).toHaveText('Enter a valid email address.');
		await expect(loginPage.email).toBeFocused();
	});

	// test.step groups a longer scenario into named phases. The HTML report and trace viewer
	// show these names as a tree, and a failure points to the step where it happened.
	test('signs out and requires sign-in to reopen the account', async ({ page }) => {
		const accountPage = await test.step('Sign in', async () => {
			return loginPage.loginAndOpenAccount('sam@example.test', 'demo-password');
		});

		await test.step('Sign out', async () => {
			await accountPage.signOut();

			await expect(page).toHaveURL(/\/login\.html$/);
			await expect(loginPage.email).toBeEmpty();
			await expect(loginPage.password).toBeEmpty();
		});

		await test.step('Reopen the account without signing in', async () => {
			await accountPage.navigate();

			await expect(page).toHaveURL(/\/login\.html$/);
			await expect(loginPage.submitButton).toBeVisible();
		});
	});
});
