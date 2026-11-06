import { beforeEach, afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  sessionStorage.clear();
});

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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 1,
              name: "Salary",
              amount: "3500.00",
              date: "2026-11-01",
            },
          ],
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

  expect(await screen.findByText("$2300.00")).toBeTruthy();
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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
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

  fireEvent.change(screen.getByLabelText(/^Name:/i), {
    target: { value: "Coffee" },
  });

  fireEvent.change(screen.getByLabelText(/^Amount:/i), {
    target: { value: "5" },
  });

  fireEvent.change(screen.getByLabelText(/^Date:/i), {
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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
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

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
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

  fireEvent.change(screen.getByLabelText(/^Amount:/i), {
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

test("shows an error and stays on login after incorrect credentials", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        detail: "Incorrect email or password",
      }),
    }),
  );

  render(<App />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
  });

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrong-password" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  const errorMessage = await screen.findByRole("alert");

  expect(errorMessage.textContent).toBe(
    "Login failed. Please check your email and password.",
  );

  expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();

  expect(
    screen.queryByRole("heading", {
      name: /my personal finance tracker/i,
    }),
  ).toBeNull();
});

test("logging out returns the user to the sign-in screen", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/login")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "test-token",
            token_type: "bearer",
          }),
        };
      }

      return {
        ok: true,
        json: async () => [],
      };
    }),
  );

  render(<App />);

  await signInForTest();

  fireEvent.click(screen.getByRole("button", { name: "Logout" }));

  expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();

  expect(
    screen.queryByRole("heading", {
      name: /my personal finance tracker/i,
    }),
  ).toBeNull();
});

test("restores the login session after remounting", async () => {
  sessionStorage.setItem("accessToken", "saved-test-token");

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  vi.stubGlobal("fetch", mockFetch);

  render(<App />);

  expect(
    await screen.findByRole("heading", {
      name: /my personal finance tracker/i,
    }),
  ).toBeTruthy();

  expect(screen.queryByLabelText("Email")).toBeNull();

  expect(mockFetch).toHaveBeenCalledWith(
    "http://127.0.0.1:8000/expenses",
    expect.objectContaining({
      headers: {
        Authorization: "Bearer saved-test-token",
      },
    }),
  );
});

test("adds income and updates the monthly balance", async () => {
  const newIncome = {
    id: 1,
    name: "Salary",
    amount: "3500.00",
    date: "2026-11-05",
  };

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/login")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: "test-token",
            token_type: "bearer",
          }),
        };
      }

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        };
      }

      if (url.endsWith("/incomes") && init?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => newIncome,
        };
      }

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    },
  );

  vi.stubGlobal("fetch", fetchMock);

  render(<App />);

  await signInForTest();

  fireEvent.change(screen.getByLabelText(/^Income name:/i), {
    target: { value: "Salary" },
  });

  fireEvent.change(screen.getByLabelText(/^Income amount:/i), {
    target: { value: "3500" },
  });

  fireEvent.change(screen.getByLabelText(/^Income date:/i), {
    target: { value: "2026-11-05" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add Income" }));

  expect(await screen.findByText(/Salary — \$3500\.00/)).toBeTruthy();

  const postCall = fetchMock.mock.calls.find(
    ([url, options]) =>
      String(url).endsWith("/incomes") && options?.method === "POST",
  );

  expect(postCall).toBeDefined();
  expect(JSON.parse(postCall![1]!.body as string)).toEqual({
    name: "Salary",
    amount: "3500",
    date: "2026-11-05",
  });

  expect(screen.getAllByText("$3500.00")).toHaveLength(2);
});

test("sends a DELETE request when deleting income", async () => {
  const existingIncome = {
    id: 7,
    name: "Freelance",
    amount: "500.00",
    date: "2026-11-05",
  };

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        };
      }

      if (url.endsWith("/incomes/7") && init?.method === "DELETE") {
        return {
          ok: true,
          status: 204,
        };
      }

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [existingIncome],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    },
  );

  vi.stubGlobal("fetch", fetchMock);
  sessionStorage.setItem("accessToken", "test-token");

  render(<App />);

  fireEvent.change(screen.getByLabelText(/Select month/i), {
    target: { value: "2026-11" },
  });

  expect(await screen.findByText(/Freelance — \$500\.00/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Delete Income" }));

  await waitFor(() => {
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          String(url).endsWith("/incomes/7") && options?.method === "DELETE",
      ),
    ).toBe(true);

    expect(screen.queryByText(/Freelance — \$500\.00/)).toBeNull();
  });
});

test("edits an existing income and updates the dashboard", async () => {
  const existingIncome = {
    id: 7,
    name: "Freelance",
    amount: "500.00",
    date: "2026-11-05",
  };

  const updatedIncome = {
    ...existingIncome,
    name: "Consulting",
    amount: "750.00",
  };

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/expenses")) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        };
      }

      if (url.endsWith("/incomes/7") && init?.method === "PUT") {
        return {
          ok: true,
          status: 200,
          json: async () => updatedIncome,
        };
      }

      if (url.endsWith("/incomes")) {
        return {
          ok: true,
          status: 200,
          json: async () => [existingIncome],
        };
      }

      throw new Error(`Unexpected API request: ${url}`);
    },
  );

  vi.stubGlobal("fetch", fetchMock);
  sessionStorage.setItem("accessToken", "test-token");

  render(<App />);

  fireEvent.change(screen.getByLabelText(/Select month/i), {
    target: { value: "2026-11" },
  });

  expect(await screen.findByText(/Freelance — \$500\.00/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Edit Income" }));

  fireEvent.change(screen.getByLabelText(/Income name:/i), {
    target: { value: "Consulting" },
  });

  fireEvent.change(screen.getByLabelText(/Income amount:/i), {
    target: { value: "750.00" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Save Income Changes" }));

  await waitFor(() => {
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          String(url).endsWith("/incomes/7") &&
          options?.method === "PUT" &&
          JSON.parse(String(options.body)).name === "Consulting" &&
          JSON.parse(String(options.body)).amount === "750.00",
      ),
    ).toBe(true);
  });

  expect(await screen.findByText(/Consulting — \$750\.00/)).toBeTruthy();

  expect(screen.queryByText(/Freelance — \$500\.00/)).toBeNull();
});
