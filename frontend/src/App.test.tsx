import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function signInForTest() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "test-password" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  await screen.findByRole("heading", {
    name: /my personal finance tracker/i,
  });
}

test("displays the Personal Finance Tracker title", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => [],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    }),
  );

  render(<App />);

  await signInForTest();

  expect(
    screen.getByRole("heading", {
      name: /my personal finance tracker/i,
    }),
  ).toBeTruthy();
});

test("calculates monthly expenses correctly", async () => {
  const mockExpenses = [
    {
      id: 1,
      name: "Groceries",
      amount: 150,
      category: "Food",
      date: "2026-11-02",
    },
    {
      id: 2,
      name: "Transport",
      amount: 50,
      category: "Transport",
      date: "2026-11-03",
    },
    {
      id: 3,
      name: "October expense",
      amount: 100,
      category: "Other",
      date: "2026-10-15",
    },
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => mockExpenses,
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    }),
  );

  render(<App />);

  await signInForTest();

  const monthInput = document.querySelector(
    'input[type="month"]',
  ) as HTMLInputElement;

  // Select November 2026, regardless of today's date.
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.change(monthInput, {
    target: { value: "2026-11" },
  });

  expect(await screen.findByText("$200.00")).toBeTruthy();
});

test("calculates the remaining balance correctly", async () => {
  const mockExpenses = [
    {
      id: 1,
      name: "Rent",
      amount: 1000,
      category: "Housing",
      date: "2026-11-01",
    },
    {
      id: 2,
      name: "Groceries",
      amount: 200,
      category: "Food",
      date: "2026-11-03",
    },
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => mockExpenses,
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    }),
  );

  render(<App />);

  await signInForTest();

  const monthInput = document.querySelector(
    'input[type="month"]',
  ) as HTMLInputElement;

  const { fireEvent } = await import("@testing-library/react");

  fireEvent.change(monthInput, {
    target: { value: "2026-11" },
  });

  expect(await screen.findByText("$1800.00")).toBeTruthy();
});

test("displays an error when the API request fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        throw new Error("Network connection failed");
      }

      throw new Error(`Unexpected API request: ${url}`);
    }),
  );

  render(<App />);

  await signInForTest();

  expect((await screen.findByRole("alert")).textContent).toMatch(
    /could not load expenses from fastapi/i,
  );
});

test("sends a POST request when adding an expense", async () => {
  const mockFetch = vi
    .fn()
    .mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses") && options?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: "Coffee",
            amount: 5,
            category: "Food",
            date: "2026-11-04",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => [],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

  vi.stubGlobal("fetch", mockFetch);

  render(<App />);

  await signInForTest();

  fireEvent.change(screen.getByLabelText(/name:/i), {
    target: { value: "Coffee" },
  });

  fireEvent.change(screen.getByLabelText(/amount:/i), {
    target: { value: "5" },
  });

  fireEvent.change(screen.getByLabelText(/date:/i), {
    target: { value: "2026-11-04" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add Expense" }));

  await screen.findByText(/Coffee — \$5\.00/);

  expect(mockFetch).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/expenses",
    expect.objectContaining({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-jwt-token",
      },
      body: JSON.stringify({
        name: "Coffee",
        amount: 5,
        category: "Food",
        date: "2026-11-04",
      }),
    }),
  );
});

test("sends a DELETE request when deleting an expense", async () => {
  const mockFetch = vi
    .fn()
    .mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses/1") && options?.method === "DELETE") {
        return { ok: true };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              name: "Coffee",
              amount: 5,
              category: "Food",
              date: "2026-11-04",
            },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

  render(<App />);

  await signInForTest();

  await screen.findByText(/Coffee — \$5\.00/);

  fireEvent.click(screen.getByRole("button", { name: "Delete" }));

  await vi.waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/expenses/1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});

test("sends a PUT request when editing an expense", async () => {
  const mockFetch = vi
    .fn()
    .mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-jwt-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses/1") && options?.method === "PUT") {
        return {
          ok: true,
          json: async () => ({
            id: 1,
            name: "Coffee",
            amount: 10,
            category: "Food",
            date: "2026-11-04",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              name: "Coffee",
              amount: 5,
              category: "Food",
              date: "2026-11-04",
            },
          ],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

  vi.stubGlobal("fetch", mockFetch);

  render(<App />);

  await signInForTest();

  await screen.findByText(/Coffee — \$5\.00/);

  fireEvent.click(screen.getByRole("button", { name: "Edit" }));

  fireEvent.change(screen.getByLabelText(/amount:/i), {
    target: { value: "10" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

  await screen.findByText(/Coffee — \$10\.00/);

  expect(mockFetch).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/expenses/1",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({
        name: "Coffee",
        amount: 10,
        category: "Food",
        date: "2026-11-04",
      }),
    }),
  );
});
