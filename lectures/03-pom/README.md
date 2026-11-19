# Lecture 3: Page Object Model

## Learning objectives

- Identify duplication and maintenance problems in script-style tests.
- Create typed page objects with locators and action methods.
- Refactor tests without changing what they verify.
- Apply useful naming, organization, and assertion practices.
- Decide when a page object is helpful and when it is unnecessary.

## Application

Open [the sign-in page](pages/login.html) directly in a browser. The HTML pages
represent a small Form & Field customer account, not the lesson itself.

Use the **fictional local account**:

- Email: `sam@example.test`
- Password: `demo-password`

Signing in opens [the account page](pages/index.html), which shows contact
details and order history. Signing out returns to sign-in. Opening the account
page without signing in also returns to sign-in.

These pages work offline and make no network requests. The credentials and
account details are fixtures; the session uses a browser-side flag and is not
real authentication. Do not enter real credentials. Reloading preserves the
session in that tab; sign out to reset it.

```text
03-pom/
  pages/
    index.html
    login.html
  page-objects/
    AccountPage.ts
    LoginPage.ts
  tests/
    login.spec.ts
```

Run the examples from the repository root:

```bash
npx playwright test lectures/03-pom
```

Add `--headed` to watch the browser.

## The problem: script-style testing

As tests grow, the same navigation, selectors, and interactions often get
copied into many files. UI changes then require updating several tests, and
low-level details can hide the actual scenario.

For example, these script-style tests repeat the page's selectors:

```ts
test('signs in with valid credentials', async ({ page }) => {
  await page.goto(loginPageUrl);
  await page.locator('#email').fill('sam@example.test');
  await page.locator('#password').fill('demo-password');
  await page.locator('#login-button').click();
  await expect(page.getByRole('heading', { name: 'Welcome back, Sam.' })).toBeVisible();
});

test('rejects invalid credentials', async ({ page }) => {
  await page.goto(loginPageUrl);
  await page.locator('#email').fill('wrong@example.test');
  await page.locator('#password').fill('wrong-password');
  await page.locator('#login-button').click();
  await expect(page.getByRole('alert')).toBeVisible();
});
```

Here, `loginPageUrl` is the local file URL for the sign-in page. If the submit
button's selector changes, how many tests should need to know about that detail?

## The solution: Page Object Model

A page object is a class representing a page or a substantial UI component.
It encapsulates that UI's locators and provides methods describing user actions.
Think of it as a small API for the page:

```ts
await loginPage.login('sam@example.test', 'demo-password');
```

### Core principles

1. **One object per page or cohesive component.** Keep responsibilities focused.
2. **Define locators once.** Keep page-specific UI knowledge in one place.
3. **Expose actions as methods.** Use meaningful names such as `login` or
   `selectCountry`.
4. **Keep verification in tests.** Page objects expose locators for Playwright's
   auto-waiting assertions; tests decide what outcome proves success.

The benefits are consistent interactions, reusable workflows, easier locator
updates, and tests that emphasize user intent rather than DOM mechanics.

## Anatomy of a page object

[LoginPage](page-objects/LoginPage.ts) receives Playwright's `Page`, creates
`Locator` instances, and offers navigation and action methods. Its basic
structure is:

```ts
import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email address');
    this.password = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.errorMessage = page.getByRole('alert');
  }

  async navigate(): Promise<void> {
    const url = pathToFileURL(resolve(__dirname, '../pages/login.html')).href;
    await this.page.goto(url);
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
```

The constructor centralizes locators. `navigate` hides the local URL and `login`
encapsulates filling and submitting the form. Creating a page object does not
navigate automatically: tests call `navigate` explicitly.

## Using page objects in tests

The [runnable tests](tests/login.spec.ts) create a new page object in
`beforeEach`. Tests still own their assertions:

```ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test('rejects invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();

  await loginPage.login('wrong@example.test', 'wrong-password');

  await expect(loginPage.errorMessage).toHaveText('Email or password is incorrect.');
});
```

### Before and after

The repeated form interactions become a single action:

```ts
await loginPage.login('sam@example.test', 'demo-password');
```

The benefit is not a guaranteed percentage reduction in code. The important
change is that repeated page details have one home and test intent is clearer.

## Advanced pattern: returning the next page object

The complete `LoginPage` also imports [AccountPage](page-objects/AccountPage.ts)
and offers an explicit successful-login workflow:

```ts
async loginAndOpenAccount(email: string, password: string): Promise<AccountPage> {
  await this.login(email, password);
  await this.page.waitForURL(/\/index\.html$/);
  return new AccountPage(this.page);
}
```

Tests can then use the next page object's locators:

```ts
const accountPage = await loginPage.loginAndOpenAccount(
  'sam@example.test',
  'demo-password',
);

await expect(accountPage.welcomeMessage).toHaveText('Welcome back, Sam.');
await expect(accountPage.email).toHaveText('sam@example.test');
```

Use this method only when successful navigation is expected. For invalid or
empty credentials, use `login` or click `submitButton` and assert the error.

## Best practices

### Organization and naming

- Use PascalCase filenames and class names with a `Page` suffix.
- Use verb-led action names: `fillEmail`, `selectCountry`, `signOut`.
- Group navigation, individual actions, and higher-level workflows clearly.
- Keep each object focused on a page or cohesive component.
- Choose locators based on what is stable in the project: role and label locators for
  stable visible text, meaningful IDs or `data-testid` for translated or frequently
  reworded UI. The page object keeps that choice in one place.
- Do not add wrappers that provide no useful intent or reuse.

### Assertions and test steps

Expose locators rather than returning a snapshot boolean or text when the
test needs an auto-waiting assertion:

```ts
await expect(loginPage.errorMessage).toHaveText('Email or password is incorrect.');
```

Use `test.step` when named phases make a longer scenario easier to follow:

```ts
await test.step('Open sign-in', async () => {
  await loginPage.navigate();
});

const accountPage = await test.step('Sign in', async () => {
  return loginPage.loginAndOpenAccount('sam@example.test', 'demo-password');
});

await expect(accountPage.welcomeMessage).toBeVisible();
```

### More complex forms

A `RegistrationFormPage` can provide individual actions such as `selectCountry`
and `setInterests`, then combine them in `completeRegistration(data)`. Give the
data a TypeScript type and use `setChecked` when applying checkbox selections
so repeated calls can both select and deselect options.

Keep the expected result values in the test. The page object should know how
to submit the form, not which values a particular scenario expects.

## Refactoring incrementally

1. Find repeated locators and action sequences.
2. Create a class in `page-objects/`.
3. Move page-specific locators into the class.
4. Extract meaningful actions and workflows.
5. Update one test or a related group of tests, retaining their assertions.
6. Run the tests to confirm behavior is unchanged.

## When to use POM

POM is useful for long-lived suites, shared pages, repeated workflows, and team
maintenance. It can be unnecessary for a disposable experiment or a small test
with only a couple of interactions. A rapidly changing UI can also make a
premature abstraction more costly than helpful.

Use it when centralizing page knowledge improves understanding or maintenance,
not because every test must use the pattern.

## Hands-on exercises

Put your page objects in `lectures/03-pom/page-objects/` and tests in
`lectures/03-pom/tests/exercise-*.spec.ts`.

1. **Contact form:** create a simple contact page, then build `ContactPage` with
   name, email, message, submit, and success locators. Add `fillName`, `fillEmail`,
   `fillMessage`, and `submitContactForm`. Verify the result in the test.
2. **Users table:** use [Lecture 2's member table](../02-playwright/pages/tables.html)
   to build `UsersTablePage`. Implement `findUserRowByName` (returning a locator),
   `getUserEmail`, and `clickEditForUser`. Assert the edited role in a test.
3. **Registration:** use [Lecture 2's registration form](../02-playwright/pages/checkboxes-radio.html)
   to build `RegistrationFormPage` and submit all its fields. Keep assertions
   for each reported value in the test.

## Homework

The [homework](homework/) folder contains a small partner portal: a
[sign-in page](homework/pages/login.html), an [orders dashboard](homework/pages/index.html)
with a data grid, and an [account page](homework/pages/account.html) with personal details.
The demo credentials appear on the sign-in page.

Create `LoginPage`, `OrdersPage`, and `AccountPage` in `homework/page-objects/`. Then
implement the 7 tests in [homework.spec.ts](homework/tests/homework.spec.ts), replacing
each `test.fixme` with `test`:

```bash
npx playwright test lectures/03-pom/homework
```

## Key takeaways

- Page objects organize page-specific locators and actions.
- Tests own their expected outcomes and assertions.
- Centralizing repeated UI details makes changes easier to manage.
- Refactor in small steps and verify behavior.
- Choose the simplest structure that helps the suite you maintain.
