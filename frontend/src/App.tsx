
import { useEffect, useState } from "react";

type Expense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  date: string;
};

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const income = 3000;

  const filteredExpenses = expenses.filter((expense) =>
    expense.date.startsWith(selectedMonth)
  );

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
  const balance = income - totalExpenses;

  useEffect(() => {
    async function loadExpenses() {
      try {
        const response = await fetch(`${API_URL}/expenses`);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data: Expense[] = await response.json();
        setExpenses(data);
      } catch (err) {
        console.error("Could not load expenses:", err);
        setError("Could not load expenses from FastAPI.");
      }
    }

    loadExpenses();
  }, []);

 
  async function handleSaveExpense(
    event: React.SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const expenseName = name.trim();
    const expenseAmount = Number(amount);

    if (
      !expenseName ||
      !date ||
      !Number.isFinite(expenseAmount) ||
      expenseAmount <= 0
    ) {
      setError("Please enter a valid name, amount, and date.");
      return;
    }

    const isEditing = editingExpenseId !== null;

    const url = isEditing
      ? `${API_URL}/expenses/${editingExpenseId}`
      : `${API_URL}/expenses`;

    try {
      setError("");

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: expenseName,
          amount: expenseAmount,
          category,
          date,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const savedExpense: Expense = await response.json();

      if (isEditing) {
        setExpenses((previousExpenses) =>
          previousExpenses.map((expense) =>
            expense.id === savedExpense.id ? savedExpense : expense
          )
        );
      } else {
        setExpenses((previousExpenses) => [
          ...previousExpenses,
          savedExpense,
        ]);
      }

      setEditingExpenseId(null);
      setName("");
      setAmount("");
      setCategory("Food");
      setDate("");
    } catch (err) {
      console.error("Could not save expense:", err);
      setError("Could not save expense. Please try again.");
    }
  }
  
  async function handleDeleteExpense(expenseId: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this expense?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch(
      `${API_URL}/expenses/${expenseId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    setExpenses((previousExpenses) =>
      previousExpenses.filter(
        (expense) => expense.id !== expenseId
      )
    );
    } catch (err) {
      console.error("Could not delete expense:", err);
      setError("Could not delete expense. Please try again.");
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpenseId(expense.id);
    setName(expense.name);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date);
    setError("");
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);
    setName("");
    setAmount("");
    setCategory("Food");
    setDate("");
    setError("");
  }

  return (
    <main>
      <h1>My Personal Finance Tracker</h1>
      <p>Take control of your money.</p>

      <h2>Dashboard</h2>

      <section>
        <h3>Monthly Overview</h3>
        <label htmlFor="selected-month">Select month: </label>
        <input
          type="month"
          id="selected-month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        />
        <p>Total Income: ${income.toFixed(2)}</p>
        <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
        <p>Balance: ${balance.toFixed(2)}</p>
      </section>

      <section>
        <h2>{editingExpenseId === null ? "Add Expense" : "Edit Expense"}</h2>

        <form onSubmit={handleSaveExpense}>
          <div>
            <label htmlFor="expense-name">Name: </label>
            <input
              id="expense-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="expense-amount">Amount: </label>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="expense-category">Category: </label>
            <select
              id="expense-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Housing">Housing</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="expense-date">Date: </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <button type="submit">
            {editingExpenseId === null ? "Add Expense" : "Save Changes"}
          </button>
            {editingExpenseId !== null && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
        )}
        </form>
      </section>

      <section>
        <h3>Recent Expenses</h3>

        {error && <p role="alert">{error}</p>}

        {filteredExpenses.length === 0 && !error ? (
          <p>No expenses found.</p>
        ) : (
          <ul>
            {filteredExpenses.map((expense) => (
             <li key={expense.id}>
                {expense.name} — ${expense.amount.toFixed(2)}
                {" "}({expense.category}, {expense.date})

                {" "}
                <button
                  type="button"
                  onClick={() => handleEditExpense(expense)}
                >
                  Edit
                </button>
                {" "}
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(expense.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
