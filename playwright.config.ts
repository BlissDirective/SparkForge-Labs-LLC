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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Forward Supabase env vars to the dev server so the (auth) route group
    // doesn't crash on module evaluation. Values come from the developer's
    // .env.local in normal use; the explicit forwarding below is the
    // belt-and-suspenders for CI / fresh sandboxes where .env.local is
    // absent. Only NEXT_PUBLIC_* are listed — these are public by design
    // (anon keys are embedded in the browser bundle).
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gqoaknfboahuqvgpidgw.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb2FrbmZib2FodXF2Z3BpZGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjUwNjAsImV4cCI6MjA4NzcwMTA2MH0.DamTvBNYHDSCQuPBDPaejDtkvBtxJWSmmcsf_IO8N-M',
    },
  },
});
