import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "go run ./cmd/server",
      cwd: "../backend",
      env: {
        NABERI_ADDR: "127.0.0.1:4101",
      },
      url: "http://127.0.0.1:4101/healthz",
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174",
      env: {
        VITE_API_BASE_URL: "http://127.0.0.1:4101",
      },
      url: "http://127.0.0.1:5174",
      timeout: 30_000,
    },
  ],
});
