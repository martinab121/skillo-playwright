import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AccountPage } from './AccountPage';

export class LoginPage {
	readonly email: Locator;
	readonly password: Locator;
	readonly submitButton: Locator;
	readonly errorMessage: Locator;

	constructor(private readonly page: Page) {
		// Each locator below has equally valid alternatives. A page object hides the choice from the
		// tests, so the team can switch strategy in ONE place if the project needs it.

		// CSS:   '#email' - SAME. The ID is meaningful and stable, and does not depend on the label text.
		//        The better choice if the login page is translated.
		// XPath: '//input[@id="email"]' - SAME, longer. A label-based XPath is possible:
		//        '//input[@id=//label[normalize-space()="Email address"]/@for]', but getByLabel is simpler.
		this.email = page.getByLabel('Email address');

		// CSS:   '#password' - SAME, and stricter: getByLabel('Password') is a substring match and would
		//        also match a control labelled "Show password" or "Confirm password" (then use exact: true).
		//        Avoid 'input[type="password"]': a "show password" toggle changes the type to "text".
		// XPath: '//input[@id="password"]' - SAME.
		this.password = page.getByLabel('Password');

		// CSS:   '#login-button' - SAME. Survives a text change such as "Sign in" -> "Log in".
		//        'button[type="submit"]' is also fine while the form has exactly one submit button.
		// XPath: '//button[normalize-space()="Sign in"]' - SAME for this <button>; it matches the visible
		//        text, like getByRole, but the selector is also usable outside Playwright.
		this.submitButton = page.getByRole('button', { name: 'Sign in', exact: true });

		// CSS:   '#login-error' or '[role="alert"]'   XPath: '//*[@id="login-error"]'
		//        SAME for these tests, because toHaveText waits until the error text appears.
		//        One difference to know: the CSS/XPath versions match the element while it is still
		//        hidden (count 1), while getByRole('alert') skips hidden elements (count 0). If a test
		//        checks presence, assert toBeVisible() explicitly with the CSS/XPath versions.
		this.errorMessage = page.getByRole('alert');
	}

	async navigate(): Promise<void> {
		const loginPageUrl = pathToFileURL(resolve(__dirname, '../pages/login.html')).href;
		await this.page.goto(loginPageUrl);
	}

	async login(email: string, password: string): Promise<void> {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.submitButton.click();
	}

	async loginAndOpenAccount(email: string, password: string): Promise<AccountPage> {
		await this.login(email, password);
		await this.page.waitForURL(/\/index\.html$/);
		return new AccountPage(this.page);
	}
}
