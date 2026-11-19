import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AccountPage } from './AccountPage';

export type OrderStatus = '' | 'Pending' | 'Paid' | 'Shipped' | 'Cancelled';

export class OrdersPage {
	readonly heading: Locator;
	readonly searchInput: Locator;
	readonly statusFilter: Locator;
	readonly sortByTotalButton: Locator;
	readonly totalHeader: Locator;
	readonly table: Locator;
	readonly rows: Locator;
	readonly resultsCount: Locator;
	readonly accountLink: Locator;
	readonly signOutButton: Locator;

	constructor(private readonly page: Page) {
		this.heading = page.getByRole('heading', { name: 'Orders', level: 1 });
		this.searchInput = page.getByLabel('Search customer');
		this.statusFilter = page.getByLabel('Status');
		this.sortByTotalButton = page.getByRole('button', { name: 'Total', exact: true });
		this.totalHeader = page.getByRole('columnheader', { name: 'Total' });
		this.table = page.getByTestId('orders-table');
		// Only real order rows carry data-order-id; the "No orders match" row does not.
		this.rows = this.table.locator('tbody tr[data-order-id]');
		this.resultsCount = page.locator('#results-count');
		this.accountLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Account' });
		this.signOutButton = page.getByRole('button', { name: 'Sign out', exact: true });
	}

	static url(): string {
		return pathToFileURL(resolve(__dirname, '../pages/index.html')).href;
	}

	async navigate(): Promise<void> {
		await this.page.goto(OrdersPage.url());
	}

	async searchCustomer(name: string): Promise<void> {
		await this.searchInput.fill(name);
	}

	async filterByStatus(status: OrderStatus): Promise<void> {
		await this.statusFilter.selectOption(status);
	}

	async sortByTotal(): Promise<void> {
		await this.sortByTotalButton.click();
	}

	/** Column values of every visible order row, e.g. column(1) = customers. */
	async columnTexts(index: number): Promise<string[]> {
		return this.rows.locator(`td:nth-child(${index + 1})`).allTextContents();
	}

	async customers(): Promise<string[]> {
		return this.columnTexts(1);
	}

	async statuses(): Promise<string[]> {
		return this.columnTexts(3);
	}

	/** Totals as numbers, e.g. "$1,240.50" -> 1240.5 */
	async totals(): Promise<number[]> {
		const texts = await this.columnTexts(4);
		return texts.map((text) => Number(text.replace(/[^\d.]/g, '')));
	}

	async openAccount(): Promise<AccountPage> {
		await this.accountLink.click();
		await this.page.waitForURL(/\/account\.html$/);
		return new AccountPage(this.page);
	}

	async signOut(): Promise<void> {
		await this.signOutButton.click();
	}
}
