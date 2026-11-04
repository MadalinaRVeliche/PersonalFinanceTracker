from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import Base, engine, get_db
from backend.models import Expense

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# Create database tables if they don't exist.
Base.metadata.create_all(bind=engine)


class ExpenseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1)
    date: date


class ExpenseResponse(ExpenseCreate):
    id: int

    model_config = {"from_attributes": True}


from typing import Annotated, TypeAlias

DBSession: TypeAlias = Annotated[Session, Depends(get_db)]


@app.get("/")
def home():
    return {"message": "Personal Finance Tracker API"}


@app.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(db: DBSession):
    return db.scalars(select(Expense).order_by(Expense.id)).all()


@app.post("/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(expense: ExpenseCreate, db: DBSession):
    new_expense = Expense(**expense.model_dump())

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@app.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: DBSession):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense


@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    updated_expense: ExpenseCreate,
    db: DBSession
):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in updated_expense.model_dump().items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@app.delete("/expenses/{expense_id}", response_model=ExpenseResponse)
def delete_expense(expense_id: int, db: DBSession):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    response = ExpenseResponse.model_validate(expense)

    db.delete(expense)
    db.commit()

    return response