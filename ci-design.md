# CI / Regression Design for Rhombus AI Tests

This describes how I would integrate the UI tests, API tests and data-validation script into CI/CD.

---

## 1. Test Tagging

I would use tags (or similar grouping) like:

- `@smoke` – fast, critical checks (auth, basic upload).
- `@ui-e2e` – full UI journeys.
- `@api` – API/network tests.
- `@data-validation` – data correctness checks.
- `@release-blocker` – tests that must pass before a release.

Examples in Playwright:

```ts
test('@smoke @api auth should succeed', async () => { ... });
test('@ui-e2e @release-blocker AI pipeline happy path', async () => { ... });
