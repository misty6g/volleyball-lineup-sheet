import { defineConfig, devices } from "@playwright/test";

const PORT = 43127;
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    ...devices["iPhone 13"],
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --hostname 127.0.0.1`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 5"] } }],
});
