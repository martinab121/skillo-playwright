import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const framesPageUrl = pathToFileURL(
	resolve(__dirname, '../pages/frames.html'),
).href;

test.beforeEach(async ({ page }) => {
	await page.goto(framesPageUrl, { waitUntil: 'domcontentloaded' });
});

test('cannot reach iframe elements from the page', async ({ page }) => {
	await expect(page.frameLocator('#my-frame').locator('#frame-input')).toBeVisible();
	await expect(page.locator('#frame-input')).toHaveCount(0);
});

test('saves a note inside the iframe', async ({ page }) => {
	const frame = page.frameLocator('#my-frame');

	// Label alternative: frame.getByLabel('Your note')   XPath: '//input[@id="frame-input"]'
	// SAME: inside a frame every strategy works the same way once the frame is located.
	await frame.locator('#frame-input').fill('Hello!');
	// Role alternative: frame.getByRole('button', { name: 'Save note' }) - SAME.
	await frame.locator('#frame-button').click();

	await expect(frame.locator('#result')).toHaveText('Saved note: Hello!');
});

test('locates the iframe by its accessible title', async ({ page }) => {
	const frame = page.frameLocator('iframe[title="Studio note form"]');

	// This test uses the role/label style for comparison with the test above.
	// CSS: '#frame-input', '#frame-button' - SAME.
	await frame.getByLabel('Your note').fill('<Hello & welcome>');
	await frame.getByRole('button', { name: 'Save note' }).click();

	// CSS: '#result'   XPath: '//*[@id="result"]' - SAME here, because toHaveText waits for the text.
	await expect(frame.getByRole('status')).toHaveText('Saved note: <Hello & welcome>');
});
