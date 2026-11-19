import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// No locator strategy wins everywhere. Each test below shows a situation in the
// same page where one approach fits best, and when another would be equally valid.
// Pick the locator that relies on what is STABLE in your project:
//   - meaningful IDs / data-* attributes agreed with developers  -> CSS
//   - stable visible text in a single-language UI                -> getByRole / getByLabel
//   - only text identifies an element and you need its relatives -> XPath or filter()

const locatorsPageUrl = pathToFileURL(
	resolve(__dirname, '../pages/locators.html'),
).href;

test.beforeEach(async ({ page }) => {
	await page.goto(locatorsPageUrl, { waitUntil: 'domcontentloaded' });
});

// SITUATION: the checkbox has a meaningful, hand-written ID ("offers").
// CSS by ID is short, fast, and portable: the same selector works in DevTools,
// document.querySelector, Selenium, or when passed to another tool or an LLM.
// EQUALLY VALID: getByRole('checkbox', { name: 'Show special offers' }) when the
// UI text is stable. It is the more readable choice when there is no ID.
test('uses a stable ID with CSS', async ({ page }) => {
	const offers = page.locator('#offers');
	await offers.check();

	await expect(offers).toBeChecked();
});

// SITUATION: the shop is translated, so every visible text changes with the language.
// getByRole('button', { name: 'Add to cart' }) would fail in Bulgarian. A data-* attribute
// agreed with developers (data-sku, data-testid) does not depend on language.
// XPath alternative: //li[@data-sku="HP-02"]//button[@data-testid="add-to-cart"]
// SAME behaviour; CSS is just shorter for attribute-only queries.
test('uses language-independent data attributes in a translated UI', async ({ page }) => {
	await page.locator('#lang-bg').click();

	await page.locator('[data-sku="HP-02"] [data-testid="add-to-cart"]').click();

	await expect(page.getByTestId('cart-count')).toHaveText('1');
	await expect(page.locator('#cart-status')).toHaveText('Studio Headphones е добавен в количката.');
});

// SITUATION: the promo banner is rendered by a CSS-in-JS library. Its class names
// (css-1q2w3e, css-8f7g6h) are generated and change on every build, and there is no ID.
// The visible text is the only stable thing, so a role locator is the best fit here.
// XPath alternative: //button[normalize-space()="Dismiss"] - SAME match; useful when the
// selector has to leave Playwright. AVOID: page.locator('.css-8f7g6h').
test('uses getByRole when class names are generated', async ({ page }) => {
	const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
	await dismiss.click();

	await expect(page.getByText('Free shipping on orders over $60.')).toBeHidden();
});

// SITUATION: a structural/data query with no user-facing role or name - prices of
// in-stock products. CSS combinators and data attributes describe this precisely.
// XPath alternative: //ul[@id="products"]/li[@data-stock="in-stock"]//*[contains(@class, "price")]
// SAME result, but longer; CSS is the natural fit for attribute and class filtering.
test('uses CSS to read prices of in-stock products', async ({ page }) => {
	const prices = page.locator('#products > li[data-stock="in-stock"] .price');

	await expect(prices).toHaveText(['$49', '$89']);
});

// SITUATION: the test data only knows the product NAME (for example, it comes from a
// spreadsheet or an API response without SKUs). All cards share the same button text.
// XPath can start at the unique name, go UP to the card, and DOWN to its button in one
// readable expression that also works in DevTools ($x) or Selenium.
// Trade-off: it depends on the card being an <li> and the name being an <h3>.
test('uses XPath to reach a product button through its ancestor', async ({ page }) => {
	const addHeadphones = page.locator(
		'xpath=//h3[normalize-space()="Studio Headphones"]/ancestor::li//button',
	);
	await addHeadphones.click();

	await expect(page.locator('#cart-status')).toHaveText('Added Studio Headphones to your cart.');
});

// SITUATION: the same case as above, solved with Playwright's filter().
// EQUALLY VALID: it does not depend on the heading tag or wrapper depth, and it reads like
// "the list item that contains this heading". It only works inside Playwright, though.
// Use whichever your team reads more easily; both select exactly one button here.
test('uses filter() for the same product button', async ({ page }) => {
	const headphones = page.getByRole('listitem').filter({
		has: page.getByRole('heading', { name: 'Studio Headphones', exact: true }),
	});
	await headphones.getByRole('button').click();

	await expect(page.getByRole('status')).toHaveText('Added Studio Headphones to your cart.');
});

// SITUATION: an error message is in the DOM from the start, hidden until it is needed.
// CSS '#coupon-error' always finds 1 element (hidden or not), while getByRole('alert')
// finds 0 until it is shown, because role locators skip hidden elements.
// BOTH are valid as long as the assertion checks visibility explicitly, as below.
test('checks a hidden error with either CSS or a role locator', async ({ page }) => {
	const errorById = page.locator('#coupon-error');
	const errorByRole = page.getByRole('alert');

	await expect(errorById).toHaveCount(1);
	await expect(errorById).toBeHidden();
	await expect(errorByRole).toHaveCount(0);

	await page.locator('#coupon').fill('NOT-A-CODE');
	await page.locator('#apply-coupon').click();

	await expect(errorById).toBeVisible();
	await expect(errorByRole).toHaveText('This coupon code is not valid.');
});
