import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    // CI's e2e-smoke job already `npm start`s the production build.
    // Playwright's default `reuseExistingServer: !CI` then races that
    // listener and exits: "http://localhost:3000 is already used".
    reuseExistingServer: true,
    timeout: 120_000,
    // Inherit process.env only. CI injects NEXT_PUBLIC_SUPABASE_* as
    // placeholders in .github/workflows/ci.yml; local `next dev` loads
    // .env.local. Do not hardcode project URL or anon JWT here.
  },
});
