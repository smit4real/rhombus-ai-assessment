import { test, expect } from '@playwright/test';

const BASE_URL = process.env.RHOMBUS_BASE_URL ?? 'https://rhombusai.com';
const USER_EMAIL = process.env.RHOMBUS_EMAIL;
const USER_PASSWORD = process.env.RHOMBUS_PASSWORD;

const AI_PIPELINE_PROMPT = `
Please clean this dataset deterministically for testing:
- Trim whitespace
- Normalize column names to lower_snake_case
- Remove exact duplicate rows
- Do not invent missing values; use null instead
- Keep row order stable except for duplicates removed
- Keep schema stable across runs
`;

test.describe('AI Pipeline – Happy Path', () => {
  test('Sign in, upload CSV, run AI pipeline, preview and download results @ui-e2e @release-blocker', async ({ page }) => {
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'RHOMBUS_EMAIL and RHOMBUS_PASSWORD must be set');

    // 1. Sign in
    await page.goto(`${BASE_URL}/login`);

    await page.getByPlaceholder(/email/i).fill(USER_EMAIL!);
    await page.getByPlaceholder(/password/i).fill(USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for dashboard / main app
    await page.waitForURL(/app|dashboard/i, { timeout: 30000 });

    // 2. Start AI pipeline flow (adjust selectors based on Rhombus UI)
    await page.getByRole('button', { name: /new pipeline|create pipeline|new project/i }).click();

    await page.getByText(/upload dataset|upload file|add data/i).click();

    // 3. Upload messy CSV
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles('data/fifa21_raw_data.csv');

    // Confirm upload
    await expect(page.getByText(/fifa21_raw_data\.csv/i)).toBeVisible({ timeout: 30000 });

    // 4. Configure AI transformation
    const promptArea = page.getByRole('textbox', { name: /prompt|describe/i }).first().or(
      page.locator('textarea').first()
    );
    await promptArea.fill(AI_PIPELINE_PROMPT);

    await page.getByRole('button', { name: /run pipeline|start pipeline|create pipeline/i }).click();

    // 5. Wait for pipeline execution
    const startedStatus = page.getByText(/running|queued|processing/i);
    await expect(startedStatus).toBeVisible({ timeout: 60000 });

    const completedStatus = page.getByText(/completed|succeeded|success/i);
    await expect(completedStatus).toBeVisible({ timeout: 240000 });

    // 6. Preview output
    await page.getByRole('button', { name: /preview|view results|open/i }).click();

    const headerCells = page.locator('table thead th');
    const dataRows = page.locator('table tbody tr');

    await expect(headerCells).toHaveCountGreaterThan(3);
    await expect(dataRows.first()).toBeVisible();

    // Basic header sanity check (adjust to real columns)
    const headerText = (await headerCells.allTextContents()).join(' ').toLowerCase();
    expect(headerText.length).toBeGreaterThan(0);

    // 7. Download results
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download|export/i }).click(),
    ]);

    const suggestedName = download.suggestedFilename();
    expect(suggestedName.toLowerCase()).toMatch(/\.csv$/);

    await download.saveAs('artifacts/ai_pipeline_output.csv');
  });
});

// Helper for count > N
expect.extend({
  async toHaveCountGreaterThan(locator: any, expected: number) {
    const count = await locator.count();
    const pass = count > expected;
    return {
      pass,
      message: () => `Expected count > ${expected}, but got ${count}`,
    };
  },
});
