import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { OrdersPage } from './OrdersPage';

export const DEMO_USER = {
	email: 'alex.morgan@example.test',
	password: 'Northwind#2026',
} as const;

export class LoginPage {
	readonly heading: Locator;
	readonly email: Locator;
	readonly password: Locator;
	readonly signInButton: Locator;
	readonly errorMessage: Locator;

	constructor(private readonly page: Page) {
		this.heading = page.getByRole('heading', { level: 1 });
		this.email = page.getByLabel('Work email');
		// exact: true so the locator stays unique if a "Show password" control is added later.
		this.password = page.getByLabel('Password', { exact: true });
		this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
		this.errorMessage = page.getByRole('alert');
	}

	static url(): string {
		return pathToFileURL(resolve(__dirname, '../pages/login.html')).href;
	}

	async navigate(): Promise<void> {
		await this.page.goto(LoginPage.url());
	}

	async login(email: string, password: string): Promise<void> {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.signInButton.click();
	}

	async loginAndOpenOrders(email: string = DEMO_USER.email, password: string = DEMO_USER.password): Promise<OrdersPage> {
		await this.login(email, password);
		await this.page.waitForURL(/\/index\.html$/);
		return new OrdersPage(this.page);
	}
}
