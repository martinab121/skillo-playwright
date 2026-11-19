import { test, expect } from '@playwright/test';
import { DEMO_USER, LoginPage } from '../page-objects/LoginPage';
import { OrdersPage } from '../page-objects/OrdersPage';

// Homework: implement these tests with the page-object model.
// Pages: ../pages/login.html, ../pages/index.html (orders) and ../pages/account.html.
// Page objects: ../page-objects/LoginPage.ts, OrdersPage.ts and AccountPage.ts.

test.describe('Northwind Supply partner portal', () => {
	let loginPage: LoginPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		await loginPage.navigate();
	});

	test('signs in with valid credentials and opens the orders dashboard', async ({ page }) => {
		const ordersPage = await loginPage.loginAndOpenOrders(DEMO_USER.email, DEMO_USER.password);

		await expect(page).toHaveURL(/\/index\.html$/);
		await expect(page).toHaveTitle('Orders | Northwind Supply');
		await expect(ordersPage.heading).toBeVisible();
		await expect(ordersPage.table).toBeVisible();
		await expect(loginPage.errorMessage).toBeHidden();
	});

	test('shows an error message for an incorrect password', async ({ page }) => {
		await loginPage.login(DEMO_USER.email, 'Wrong#Password1');

		await expect(loginPage.errorMessage).toHaveText('Email or password is incorrect.');
		await expect(page).toHaveURL(/\/login\.html$/);
		await expect(loginPage.signInButton).toBeVisible();
	});

	test('lists all 8 orders in the grid after sign in', async () => {
		const ordersPage = await loginPage.loginAndOpenOrders();

		await expect(ordersPage.rows).toHaveCount(8);
		await expect(ordersPage.resultsCount).toHaveText('Showing 8 of 8 orders');
		await expect(ordersPage.rows.first()).toContainText('NW-1042');
		await expect(ordersPage.rows.last()).toContainText('NW-1049');
	});

	test('able to filter the orders grid by customer name and status', async () => {
		const ordersPage = await loginPage.loginAndOpenOrders();

		await test.step('Filter by customer name', async () => {
			await ordersPage.searchCustomer('Harbor Books');

			await expect(ordersPage.rows).toHaveCount(2);
			await expect(ordersPage.resultsCount).toHaveText('Showing 2 of 8 orders');
			expect(await ordersPage.customers()).toEqual(['Harbor Books', 'Harbor Books']);
		});

		await test.step('Add a status filter', async () => {
			await ordersPage.filterByStatus('Pending');

			await expect(ordersPage.rows).toHaveCount(1);
			await expect(ordersPage.rows.first()).toContainText('NW-1047');
			await expect(ordersPage.resultsCount).toHaveText('Showing 1 of 8 orders');
			expect(await ordersPage.statuses()).toEqual(['Pending']);
		});

		await test.step('A combination with no matches shows the empty state', async () => {
			await ordersPage.filterByStatus('Cancelled');

			await expect(ordersPage.rows).toHaveCount(0);
			await expect(ordersPage.table).toContainText('No orders match your filters.');
			await expect(ordersPage.resultsCount).toHaveText('Showing 0 of 8 orders');
		});
	});

	test('able to sort orders by total from highest to lowest', async () => {
		const ordersPage = await loginPage.loginAndOpenOrders();

		await ordersPage.sortByTotal();

		await expect(ordersPage.totalHeader).toHaveAttribute('aria-sort', 'descending');
		await expect(ordersPage.rows.first()).toContainText('$3,020.00');
		await expect(ordersPage.rows.last()).toContainText('$96.40');

		const totals = await ordersPage.totals();
		expect(totals).toHaveLength(8);
		expect(totals).toEqual([...totals].sort((a, b) => b - a));
	});

	test('updates the phone number on the account page and shows it in the summary', async () => {
		const ordersPage = await loginPage.loginAndOpenOrders();
		const accountPage = await ordersPage.openAccount();
		const newPhone = '+359 888 123 456';

		await expect(accountPage.heading).toBeVisible();
		await expect(accountPage.summaryPhone).toHaveText('+1 555 010 4477');

		await accountPage.updatePhone(newPhone);

		await expect(accountPage.statusMessage).toHaveText('Your details have been saved.');
		await expect(accountPage.summaryPhone).toHaveText(newPhone);
		await expect(accountPage.phone).toHaveValue(newPhone);
		await expect(accountPage.errorMessage).toBeHidden();
	});

	test('signs out and redirects to sign in when the orders page is opened again', async ({ page }) => {
		const ordersPage = await test.step('Sign in', async () => {
			return loginPage.loginAndOpenOrders();
		});

		await test.step('Sign out', async () => {
			await ordersPage.signOut();

			await expect(page).toHaveURL(/\/login\.html$/);
			await expect(loginPage.signInButton).toBeVisible();
		});

		await test.step('Open the orders page again without signing in', async () => {
			await page.goto(OrdersPage.url());

			await expect(page).toHaveURL(/\/login\.html$/);
			await expect(loginPage.heading).toHaveText('Sign in to your account.');
		});
	});
});
