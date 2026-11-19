import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkboxesPageUrl = pathToFileURL(
	resolve(__dirname, '../pages/checkboxes-radio.html'),
).href;

test.beforeEach(async ({ page }) => {
	await page.goto(checkboxesPageUrl, { waitUntil: 'domcontentloaded' });
});

test('shows the default selections', async ({ page }) => {
	// Attribute selector: every id that starts with "interest".
	await expect(page.locator('[id^="interest"]:checked')).toHaveCount(0);
	// CSS: '#exp-beginner', '#newsletter', '#terms'
	// XPath: '//input[@id="exp-beginner"]' (same pattern for the others)
	// SAME: the IDs here are hand-written and meaningful. Use them when labels are translated
	// or reworded often; use getByLabel when the label text is the stable part.
	await expect(page.getByLabel('Beginner')).toBeChecked();
	await expect(page.getByLabel('Send me the newsletter')).toBeChecked();
	await expect(page.getByLabel('Accept Terms')).not.toBeChecked();
});


test('checks and unchecks a checkbox', async ({ page }) => {
	// CSS: '#interest-testing'   XPath: '//input[@id="interest-testing"]'
	// SAME: both find this checkbox. The role locator reads closer to the test intent;
	// the ID is independent of the UI language.
	const testing = page.getByRole('checkbox', { name: 'Testing' });

	await testing.check();
	await expect(testing).toBeChecked();

	await testing.uncheck();
	await expect(testing).not.toBeChecked();
});

test('allows only one experience level', async ({ page }) => {
	// Role: getByRole('radio', { name: 'Advanced' })   XPath: '//input[@id="exp-advanced"]'
	// SAME: '#exp-advanced' is stable and self-explanatory. The role locator is a good choice
	// when there is no ID; the XPath adds nothing over CSS for a plain ID lookup.
	await page.locator('#exp-advanced').check();

	await expect(page.getByLabel('Advanced')).toBeChecked();
	await expect(page.getByLabel('Beginner')).not.toBeChecked();
	await expect(page.locator('input[name="experience"]:checked')).toHaveCount(1);
});

test('requires the terms before registering', async ({ page }) => {
	// CSS: '#submit-button' or '[data-testid="submit-btn"]'   XPath: '//button[@id="submit-button"]'
	// SAME: all find the one submit button. The ID/test ID keeps working if the text changes.
	await page.getByRole('button', { name: 'Submit Registration' }).click();

	// CSS: '#terms-error'   XPath: '//*[@id="terms-error"]'
	// SAME here because toHaveText waits for the text to appear. 
	// Note the difference: the ID selector also matches the element while it is hidden;
	// getByRole('alert') matches only visible alerts.
	await expect(page.getByRole('alert')).toHaveText(
		'Please accept the terms before registering.',
	);
	await expect(page.getByLabel('Accept Terms')).toBeFocused();
	await expect(page.locator('#registration-result')).toBeHidden();
});

test('submits the selected preferences', async ({ page }) => {
	// CSS: '#interest-design', '#interest-testing', '#exp-intermediate', '#newsletter', '#terms'
	// SAME: each ID matches one input. Choose one style per suite so the tests read consistently.
	await page.getByLabel('Design').check();
	await page.getByLabel('Testing').check();
	await page.getByLabel('Intermediate').check();
	await page.getByLabel('Send me the newsletter').uncheck();
	await page.getByLabel('Accept Terms').check();
	// data-testid is an explicit contract between developers and QA: it survives text,
	// translation, and styling changes. CSS equivalent: '[data-testid="submit-btn"]'.
	// Role alternative: getByRole('button', { name: 'Submit Registration' }) - SAME in an English-only UI.
	await page.getByTestId('submit-btn').click();

	// CSS: '#terms-error'   XPath: '//*[@id="terms-error"]'
	// SAME: toBeHidden passes for a hidden element and for a missing element alike.
	await expect(page.getByRole('alert')).toBeHidden();
	const textOfResult = await page.locator('#registration-result').textContent();
	console.log(`Value of textOfResult: ${textOfResult}`);
	await expect(page.locator('#registration-result')).toHaveText(
		'Registration complete.\nInterests: Design, Testing.\nExperience: Intermediate.\nNewsletter: No.',
	);
});

test('hides the previous result after a change', async ({ page }) => {
	// CSS: '#terms', '#submit-button', '#interest-development' - SAME controls, see the tests above.
	await page.getByLabel('Accept Terms').check();
	await page.getByRole('button', { name: 'Submit Registration' }).click();
	await expect(page.locator('#registration-result')).toBeVisible();

	await page.getByLabel('Development').check();

	await expect(page.locator('#registration-result')).toBeHidden();
});
