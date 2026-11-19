# Playwright + TypeScript UI Test Automation

[![Playwright Tests](https://github.com/martinab121/skillo-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/martinab121/skillo-playwright/actions/workflows/playwright.yml)

End-to-end UI test automation with **Playwright** and **TypeScript**, built during the
Skillo course *Playwright Automation with TypeScript & AI*. The suite covers locators,
user input, dialogs, frames, tables and file uploads, and uses the **Page Object Model**.
It runs automatically on every push via GitHub Actions.

## Tech stack

| Area            | Tools                                  |
| --------------- | -------------------------------------- |
| Language        | TypeScript (strict mode)               |
| Test framework  | Playwright Test                        |
| Browser         | Chromium                               |
| Design pattern  | Page Object Model                      |
| Reporting       | Playwright HTML report, traces         |
| CI              | GitHub Actions                         |

## Highlights

### Page Object Model – Northwind Supply partner portal

[`lectures/03-pom/homework`](lectures/03-pom/homework) tests a small order-management
portal with three page objects:

| Page object                                                              | Responsibility                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------- |
| [`LoginPage`](lectures/03-pom/homework/page-objects/LoginPage.ts)       | Sign in, error messages                         |
| [`OrdersPage`](lectures/03-pom/homework/page-objects/OrdersPage.ts)     | Orders grid: search, status filter, sort, read  |
| [`AccountPage`](lectures/03-pom/homework/page-objects/AccountPage.ts)   | Profile form and account summary               |

Scenarios in [`homework.spec.ts`](lectures/03-pom/homework/tests/homework.spec.ts):

1. Signs in with valid credentials and opens the orders dashboard
2. Shows an error message for an incorrect password
3. Lists all 8 orders in the grid after sign in
4. Filters the orders grid by customer name and status
5. Sorts orders by total from highest to lowest
6. Updates the phone number and shows it in the account summary
7. Signs out and redirects to sign in when the orders page is opened again

Page methods return the next page object (e.g. `loginAndOpenOrders()` → `OrdersPage`),
and assertions stay in the tests, so each test reads as a user flow.

### Other areas covered

| Folder                                                   | Topics                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`tests/`](tests)                                        | Live tests against the ISkillo training app: home page, login form     |
| [`lectures/01-playwright`](lectures/01-playwright)       | First tests on local pages                                             |
| [`lectures/02-playwright`](lectures/02-playwright)       | CSS / XPath / role locators, checkboxes, dropdowns, dialogs, iframes, tables, dynamic content, file uploads |
| [`lectures/03-pom`](lectures/03-pom)                     | Page Object Model                                                      |

## Getting started

Requirements: [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm ci
npx playwright install --with-deps chromium
```

## Running the tests

```bash
npm test                                      # whole suite, headless
npx playwright test lectures/03-pom/homework  # POM homework only
npm run test:headed                           # watch the browser
npm run test:ui                               # Playwright UI mode
npm run report                                # open the last HTML report
```

## Project structure

```
├── .github/workflows/      # CI: runs the suite on every push
├── lectures/
│   ├── 01-playwright/      # pages/ (HTML under test) + tests/
│   ├── 02-playwright/
│   └── 03-pom/
│       └── homework/
│           ├── pages/          # Northwind portal HTML
│           ├── page-objects/   # LoginPage, OrdersPage, AccountPage
│           └── tests/          # homework.spec.ts
├── tests/                  # tests against the ISkillo training app
├── playwright.config.ts
└── tsconfig.json
```

## Related

- [Selenium](https://github.com/martinab121/Selenium) – earlier UI automation with Selenium WebDriver, C# and NUnit
