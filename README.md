# Skillo – Playwright Automation with TypeScript & AI

Course project for Playwright + TypeScript QA automation.

## Setup

    npm install
    npx playwright install chromium

## Run

    npm test                                     # all tests, headless
    npx playwright test lectures/03-pom/homework # Lecture 3 homework only
    npm run test:headed                          # watch the browser
    npm run test:ui                              # Playwright UI mode
    npm run report                               # open the last HTML report
    npm run codegen                              # record a test against ISkillo

## Structure

- `tests/` – first tests against the ISkillo training app (http://training.skillo-bg.com:4300)
- `lectures/01-playwright/` – Lecture 1: first local pages and a login test
- `lectures/02-playwright/` – Lecture 2: locators, inputs, dropdowns, dialogs, frames, tables, uploads
- `lectures/03-pom/` – Lecture 3: Page Object Model
  - `page-objects/`, `tests/` – lecture demo
  - `homework/` – **Lecture 3 homework**: the Northwind Supply partner portal
    - `pages/` – login, orders and account HTML pages
    - `page-objects/` – `LoginPage`, `OrdersPage`, `AccountPage`
    - `tests/homework.spec.ts` – 7 scenarios built on those page objects

### Lecture 3 homework scenarios

1. Signs in with valid credentials and opens the orders dashboard
2. Shows an error message for an incorrect password
3. Lists all 8 orders in the grid after sign in
4. Filters the orders grid by customer name and status
5. Sorts orders by total from highest to lowest
6. Updates the phone number on the account page and shows it in the summary
7. Signs out and redirects to sign in when the orders page is opened again

## In the dev pod only

Headless Chromium needs extra libraries here:

    export LD_LIBRARY_PATH=$HOME/.local/chromium-deps/prefix/usr/lib/x86_64-linux-gnu:$HOME/.local/chromium-deps/prefix/lib/x86_64-linux-gnu
