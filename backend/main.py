from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException

app = FastAPI()

class ExpenseCreate(BaseModel):
    name: str
    amount: float
    category: str
    date: str

@app.get("/")
def home():
    return {"message": "Personal Finance Tracker API"}

expenses = [
    {
        "id": 1,
        "name": "Groceries",
        "amount": 45.50,
        "category": "food",
        "date": "2026-11-03"
    },
    {
        "id": 2,
        "name": "Bus ticket",
        "amount": 3.00,
        "category": "transport",
        "date": "2026-11-03"
    }
]

@app.get("/expenses")
def get_expenses():
    return expenses

@app.post("/expenses", status_code=201)
def create_expense(expense: ExpenseCreate):
    new_expense = expense.model_dump()

    new_expense["id"] = max(
        (item["id"] for item in expenses),
        default=0
    ) + 1

    expenses.append(new_expense)

    return new_expense

@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):
    for expense in expenses:
        if expense["id"] == expense_id:
            return expense

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )

@app.put("/expenses/{expense_id}")
def update_expense(expense_id: int, updated_expense: ExpenseCreate):
    for expense in expenses:
        if expense["id"] == expense_id:
            expense.update(updated_expense.model_dump())
            return expense

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    for index, expense in enumerate(expenses):
        if expense["id"] == expense_id:
            return expenses.pop(index)

    raise HTTPException(
        status_code=404,
        detail="Expense not found"
    )