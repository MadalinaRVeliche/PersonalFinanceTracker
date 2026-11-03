const expenseInput = document.getElementById("expense");
const expenseForm = document.getElementById("expense-form");
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
const expensesTable = document.getElementById("expenses-table");

const monthInput = document.getElementById("selected-month");

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

let editingExpense = null;

const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const submitButton = expenseForm.querySelector('button[type="submit"]');
const cancelEditButton = document.getElementById("cancel-edit");

monthInput.value = currentMonth;

function addExpenseToTable(expense) {
    const row = expensesTable.insertRow();
    const deleteButton = document.createElement("button");
    const editButton = document.createElement("button");
   
    row.insertCell(0).textContent = expense.name;
    row.insertCell(1).textContent = `$${expense.amount.toFixed(2)}`;
    
    const actionsCell = row.insertCell(2);
    
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";
    deleteButton.addEventListener("click", function () {
        deleteExpense(expense);
    });
    actionsCell.appendChild(deleteButton);


    editButton.textContent = "Edit";
    editButton.type = "button";
    editButton.addEventListener("click", function () {
        editExpense(expense);
    });
    actionsCell.appendChild(editButton);
}

function deleteExpense(expenseToDelete) {
    expenses = expenses.filter(function (expense) {
        return expense !== expenseToDelete;
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));

    renderExpenses();
    updateTotalExpenses();
}

function editExpense(expense) {
    editingExpense = expense;

    expenseInput.value = expense.name;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;

    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;
    expenseInput.focus();
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

cancelEditButton.addEventListener("click", function () {
    editingExpense = null;
    expenseForm.reset();
    submitButton.textContent = "Add Expense";
    cancelEditButton.hidden = true;
});

monthInput.addEventListener("change", function () {
    renderExpenses();
    updateTotalExpenses();
});

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const expenseData = {
        name: expenseInput.value.trim(),
        amount: Number(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value
    };

    if (expenseData.name === "" ||
        !Number.isFinite(expenseData.amount) ||
        expenseData.amount < 0) {
        alert("Please enter a valid expense.");
        return;
    }

    if (editingExpense !== null) {
        // Update the existing expense object
        editingExpense.name = expenseData.name;
        editingExpense.amount = expenseData.amount;
        editingExpense.category = expenseData.category;
        editingExpense.date = expenseData.date;
    } else {
        // Create a new expense
        expenses.push(expenseData);
    }

    localStorage.setItem("expenses", JSON.stringify(expenses));

    renderExpenses();
    updateTotalExpenses();

    expenseForm.reset();
    editingExpense = null;
    submitButton.textContent = "Add Expense";
    cancelEditButton.hidden = true;
});



