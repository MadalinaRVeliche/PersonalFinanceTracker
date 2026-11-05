import { test, expect } from "@playwright/test";

test("displays the login screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Personal Finance Tracker" })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Sign in" })
  ).toBeVisible();

  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Sign in" })
  ).toBeVisible();
});


test("rejects incorrect login credentials", async ({ page }) => {
  await page.route("**/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Incorrect email or password",
      }),
    });
  });

  await page.goto("/");

  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("wrong-password");

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Login failed. Please check your email and password."
  );

  await expect(
    page.getByRole("heading", { name: "Sign in" })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: /my personal finance tracker/i,
    })
  ).toHaveCount(0);
});

test("logs in successfully and displays the dashboard", async ({ page }) => {
  await page.route("**/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-token",
        token_type: "bearer",
      }),
    });
  });

  await page.route("**/expenses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/");

  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", {
      name: /my personal finance tracker/i,
    })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Logout" })
  ).toBeVisible();
});

test("logs out and returns to the sign-in screen", async ({ page }) => {
  await page.route("**/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-token",
        token_type: "bearer",
      }),
    });
  });

  await page.route("**/expenses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/");

  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(
    page.getByRole("heading", { name: "Sign in" })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Logout" })
  ).toHaveCount(0);
});

