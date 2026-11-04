import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app


@pytest.fixture
def client():
    # Create a separate in-memory SQLite database.
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(bind=test_engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    # Redirect FastAPI to the test database.
    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def test_get_expenses(client):
    response = client.get("/expenses")

    assert response.status_code == 200
    assert response.json() == []


def test_create_expense(client):
    new_expense = {
        "name": "Groceries",
        "amount": 45.50,
        "category": "food",
        "date": "2026-11-04"
    }

    response = client.post("/expenses", json=new_expense)

    assert response.status_code == 201

    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Groceries"
    assert data["amount"] == 45.50
    assert data["category"] == "food"

    # Verify the expense was saved.
    get_response = client.get("/expenses")

    assert get_response.status_code == 200
    assert len(get_response.json()) == 1
    assert get_response.json()[0]["name"] == "Groceries"


def test_reject_negative_amount(client):
    invalid_expense = {
        "name": "Coffee",
        "amount": -5.50,
        "category": "food",
        "date": "2026-11-03"
    }

    response = client.post("/expenses", json=invalid_expense)

    assert response.status_code == 422
    assert client.get("/expenses").json() == []


def test_reject_invalid_date(client):
    invalid_expense = {
        "name": "Coffee",
        "amount": 5.50,
        "category": "food",
        "date": "2026-13-45"
    }

    response = client.post("/expenses", json=invalid_expense)

    assert response.status_code == 422
    assert client.get("/expenses").json() == []


def test_get_missing_expense(client):
    response = client.get("/expenses/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"


def test_update_expense(client):
    original_expense = {
        "name": "Groceries",
        "amount": 45.50,
        "category": "food",
        "date": "2026-11-04"
    }

    create_response = client.post(
        "/expenses",
        json=original_expense
    )
    assert create_response.status_code == 201

    expense_id = create_response.json()["id"]

    updated_data = {
        "name": "Updated groceries",
        "amount": 75.00,
        "category": "food",
        "date": "2026-11-03"
    }

    response = client.put(
        f"/expenses/{expense_id}",
        json=updated_data
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated groceries"
    assert response.json()["amount"] == 75.00

    # Verify the database contains the updated values.
    get_response = client.get(f"/expenses/{expense_id}")

    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Updated groceries"


def test_delete_expense(client):
    new_expense = {
        "name": "Temporary expense",
        "amount": 10.00,
        "category": "other",
        "date": "2026-11-03"
    }

    create_response = client.post(
        "/expenses",
        json=new_expense
    )
    assert create_response.status_code == 201

    expense_id = create_response.json()["id"]

    delete_response = client.delete(f"/expenses/{expense_id}")

    assert delete_response.status_code == 200

    get_response = client.get(f"/expenses/{expense_id}")

    assert get_response.status_code == 404