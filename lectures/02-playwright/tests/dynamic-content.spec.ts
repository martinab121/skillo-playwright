import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dynamicContentPageUrl = pathToFileURL(
	resolve(__dirname, '../pages/dynamic-content.html'),
).href;

test.beforeEach(async ({ page }) => {
	await page.goto(dynamicContentPageUrl, { waitUntil: 'domcontentloaded' });
});

test('shows a loading state while the collection loads', async ({ page }) => {
	// CSS: '#load-button'   XPath: '//button[@id="load-button"]'
	// SAME for clicking. The test already mixes both styles: '#load-button' below checks the state.
	await page.getByRole('button', { name: 'Load collection' }).click();

	await expect(page.getByText('Loading collection...')).toBeVisible();
	await expect(page.locator('#load-button')).toBeDisabled();
});

test('loads the collection items', async ({ page }) => {
	// Heading - CSS: '#content-heading' or '#content h3'   XPath: '//*[@id="content-heading"]'
	// SAME: the heading has a stable ID; getByRole matches it by its visible text instead.
	await page.getByRole('button', { name: 'Load collection' }).click();

	// Web-first assertions retry until the condition is met or the timeout expires.
	await expect(page.locator('#loading')).toBeHidden();
	await expect(page.getByRole('heading', { name: 'Ready to explore' })).toBeVisible();
	await expect(page.locator('.item')).toHaveCount(6);
	await expect(page.locator('.item').first()).toHaveText('Everyday Notebook');
	await expect(page.getByRole('button', { name: 'Reload collection' })).toBeEnabled();
});

test('waits explicitly for the content to appear', async ({ page }) => {
	// CSS is the best fit for the assertion below: aria-busy is an attribute of a container
	// without a role or name of its own.
	await page.getByRole('button', { name: 'Load collection' }).click();

	await expect(page.locator('#content')).toHaveAttribute('aria-busy', 'false');
});

test('does not duplicate items when reloading', async ({ page }) => {
	// One button changes its text from "Load collection" to "Reload collection".
	// TEXT-BASED locators fit when the text change IS the behaviour under test: the text tells
	// which state we expect.
	//   Role:  getByRole('button', { name: 'Reload collection' })
	//          Case-insensitive SUBSTRING match on the accessible name (aria-label or text).
	//   XPath: '//button[normalize-space()="Reload collection"]'
	//          Exact, case-sensitive match on the <button>'s text; also works in DevTools ($x) and Selenium.
	// Both select the same button here, but they do NOT match the same way. The difference shows
	// with overlapping texts: getByRole('button', { name: 'Load collection' }) ALSO matches
	// "Reload collection", while '//button[normalize-space()="Load collection"]' does not.
	// Closest role equivalent of the XPath: getByRole('button', { name: 'Reload collection', exact: true }).
	// CSS '#load-button' is BETTER when you only want "the load button" in any state
	// (add toHaveText('Reload collection') to check the text separately).
	await page.getByRole('button', { name: 'Load collection' }).click();
	await page.getByRole('button', { name: 'Reload collection' }).click();

	await expect(page.getByRole('button', { name: 'Reload collection' })).toBeEnabled();
	await expect(page.locator('.item')).toHaveCount(6);
});

test('enables ordering after preparation finishes', async ({ page }) => {
	// CSS: '#place-order-button', '#prepare-button'   XPath: '//button[@id="place-order-button"]'
	// SAME: stable, descriptive IDs. Both styles make it clear which action each button performs.
	const placeOrder = page.getByRole('button', { name: 'Place demo order' });
	await expect(placeOrder).toBeDisabled();

	await page.getByRole('button', { name: 'Prepare order' }).click();
	await expect(page.locator('#order-status')).toHaveText('Preparing your order...');

	// click() auto-waits until the button becomes enabled.
	await placeOrder.click();

	await expect(page.locator('#order-status')).toHaveText('Demo order placed.');
	await expect(placeOrder).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Prepare order' })).toBeEnabled();
});
