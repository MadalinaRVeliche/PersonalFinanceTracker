import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,

  workers: 1,

  use: {
    baseURL: "http://localhost:5173",
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },

  reporter: "list",
});
