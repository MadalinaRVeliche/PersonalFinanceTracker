from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import Base, engine, get_db
from backend.models import Expense, User

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://personal-finance-tracker-ac7w.onrender.com",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


bearer_scheme = HTTPBearer(auto_error=False)

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
    allow_headers=["Content-Type", "Authorization"],
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


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


from typing import Annotated, TypeAlias

DBSession: TypeAlias = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DBSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@app.get("/")
def home():
    return {"message": "Personal Finance Tracker API"}


@app.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(
    db: DBSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return db.scalars(
        select(Expense).where(Expense.owner_id == current_user.id).order_by(Expense.id)
    ).all()


@app.post("/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(
    expense: ExpenseCreate,
    db: DBSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    new_expense = Expense(
        **expense.model_dump(),
        owner_id=current_user.id,
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@app.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: DBSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.owner_id == current_user.id,
        )
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    return expense


@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    updated_expense: ExpenseCreate,
    db: DBSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.owner_id == current_user.id,
        )
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    for field, value in updated_expense.model_dump().items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@app.delete("/expenses/{expense_id}", response_model=ExpenseResponse)
def delete_expense(
    expense_id: int,
    db: DBSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.owner_id == current_user.id,
        )
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    response = ExpenseResponse.model_validate(expense)

    db.delete(expense)
    db.commit()

    return response


@app.post("/register", response_model=UserResponse, status_code=201)
def register_user(user: UserCreate, db: DBSession):
    existing_user = db.scalar(select(User).where(User.email == user.email))

    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = User(email=user.email, hashed_password=hash_password(user.password))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, db: DBSession):
    user = db.scalar(select(User).where(User.email == credentials.email))

    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id)

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@app.get("/health")
def health_check():
    return {"status": "ok"}
