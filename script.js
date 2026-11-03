const expenseInput = document.getElementById("expense");
const expenseForm = document.getElementById("expense-form");
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
const expensesTable = document.getElementById("expenses-table");

const monthInput = document.getElementById("selected-month");

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

monthInput.value = currentMonth;

function addExpenseToTable(expense) {
    const row = expensesTable.insertRow();

    row.insertCell(0).textContent = expense.name;
    row.insertCell(1).textContent = `$${expense.amount.toFixed(2)}`;
}

function renderExpenses() {
    while (expensesTable.rows.length > 1) {
        expensesTable.deleteRow(1);
    }

    expenses.forEach(function (expense) {
        if (expense.date.slice(0, 7) === monthInput.value) {
            addExpenseToTable(expense);
        }
    });
}

function updateTotalExpenses() {
    let total = 0;
    
    expenses.forEach(function (expense) {
        if (expense.date.slice(0, 7) === monthInput.value) {
            total += expense.amount;
        }
    });

    document.getElementById("total-expenses").textContent =
        `$${total.toFixed(2)}`;

    const income = 3000;
    const balance = income - total;

    document.getElementById("balance").textContent =
        `$${balance.toFixed(2)}`;
}

renderExpenses();
updateTotalExpenses();

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const expense = {
        name: expenseInput.value,
        amount: Number(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value
    };

    expenses.push(expense);
    updateTotalExpenses();

    localStorage.setItem("expenses", JSON.stringify(expenses));
    
    renderExpenses();
    expenseForm.reset();
});

monthInput.addEventListener("change", function () {
    renderExpenses();
    updateTotalExpenses();
});

