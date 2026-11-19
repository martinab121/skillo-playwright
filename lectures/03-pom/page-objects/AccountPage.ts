import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export class AccountPage {
	readonly welcomeMessage: Locator;
	readonly email: Locator;

	constructor(private readonly page: Page) {
		// CSS: 'h1'   XPath: '//h1' - SAME. An <h1> is a level-1 heading; all three are short and clear.
		this.welcomeMessage = page.getByRole('heading', { level: 1 });
		// The email is plain text with no role or label, so a stable ID is the natural hook here.
		this.email = page.locator('#account-email');
	}

	async navigate(): Promise<void> {
		const accountPageUrl = pathToFileURL(resolve(__dirname, '../pages/index.html')).href;
		await this.page.goto(accountPageUrl);
	}

	async signOut(): Promise<void> {
		// CSS:   '#logout-button' - SAME. Stable ID; keeps working if the text becomes "Log out".
		// XPath: '//button[normalize-space()="Sign out"]' - SAME, matches the same visible text.
		await this.page.getByRole('button', { name: 'Sign out', exact: true }).click();
	}
}
