import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export class AccountPage {
	readonly heading: Locator;
	readonly summaryName: Locator;
	readonly summaryEmail: Locator;
	readonly summaryPhone: Locator;
	readonly firstName: Locator;
	readonly lastName: Locator;
	readonly phone: Locator;
	readonly language: Locator;
	readonly saveButton: Locator;
	readonly cancelButton: Locator;
	readonly errorMessage: Locator;
	readonly statusMessage: Locator;
	readonly signOutButton: Locator;

	constructor(private readonly page: Page) {
		this.heading = page.getByRole('heading', { name: 'Personal information', level: 1 });
		// The summary values are plain <dd> text with no role or label, so stable IDs are the best hook.
		this.summaryName = page.locator('#summary-name');
		this.summaryEmail = page.locator('#summary-email');
		this.summaryPhone = page.locator('#summary-phone');
		this.firstName = page.getByLabel('First name');
		this.lastName = page.getByLabel('Last name');
		this.phone = page.getByLabel('Phone number');
		this.language = page.getByLabel('Preferred language');
		this.saveButton = page.getByRole('button', { name: 'Save changes' });
		this.cancelButton = page.getByRole('button', { name: 'Cancel' });
		this.errorMessage = page.getByRole('alert');
		this.statusMessage = page.locator('#profile-status');
		this.signOutButton = page.getByRole('button', { name: 'Sign out', exact: true });
	}

	static url(): string {
		return pathToFileURL(resolve(__dirname, '../pages/account.html')).href;
	}

	async navigate(): Promise<void> {
		await this.page.goto(AccountPage.url());
	}

	async updatePhone(phone: string): Promise<void> {
		await this.phone.fill(phone);
		await this.saveButton.click();
	}

	async signOut(): Promise<void> {
		await this.signOutButton.click();
	}
}
