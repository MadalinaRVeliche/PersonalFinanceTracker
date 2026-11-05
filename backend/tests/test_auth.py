from fastapi.testclient import TestClient

from backend.main import app
from datetime import datetime, timedelta, timezone

import jwt

from backend.security import JWT_SECRET_KEY
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db


@pytest.fixture
def client():
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

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def test_expenses_require_authentication(client):
    response = client.get("/expenses")

    assert response.status_code == 401


def test_expenses_reject_invalid_token(client):
    response = client.get(
        "/expenses",
        headers={"Authorization": "Bearer this-is-not-a-valid-jwt"},
    )

    assert response.status_code == 401


def test_expenses_reject_expired_token(client):
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=5)

    expired_token = jwt.encode(
        {"sub": "1", "exp": expired_time},
        JWT_SECRET_KEY,
        algorithm="HS256",
    )

    response = client.get(
        "/expenses",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401


def test_duplicate_registration_is_rejected(client):
    email = "duplicate-test@example.com"
    password = "secure-password-123"

    first_response = client.post(
        "/register",
        json={"email": email, "password": password},
    )

    second_response = client.post(
        "/register",
        json={"email": email, "password": password},
    )

    assert first_response.status_code in (200, 201)
    assert second_response.status_code == 409


def test_users_cannot_see_each_others_expenses(client):
    # Register two independent users.
    users = [
        ("alice@example.com", "alice-password-123"),
        ("bob@example.com", "bob-password-123"),
    ]

    tokens = {}

    for email, password in users:
        register_response = client.post(
            "/register",
            json={"email": email, "password": password},
        )
        assert register_response.status_code in (200, 201)

        login_response = client.post(
            "/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200

        tokens[email] = login_response.json()["access_token"]

    alice_headers = {"Authorization": f"Bearer {tokens['alice@example.com']}"}
    bob_headers = {"Authorization": f"Bearer {tokens['bob@example.com']}"}

    # Alice creates an expense.
    create_response = client.post(
        "/expenses",
        json={
            "name": "Alice's private expense",
            "amount": 50,
            "category": "Food",
            "date": "2026-11-05",
        },
        headers=alice_headers,
    )
    assert create_response.status_code in (200, 201), create_response.json()

    # Bob requests his own expenses.
    bob_response = client.get(
        "/expenses",
        headers=bob_headers,
    )

    assert bob_response.status_code == 200
    assert bob_response.json() == []

    # Bob tries to delete Alice's expense using its ID.
    alice_expense_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/expenses/{alice_expense_id}",
        headers=bob_headers,
    )

    assert delete_response.status_code == 404

    # Verify Alice's expense still exists.
    alice_response = client.get(
        "/expenses",
        headers=alice_headers,
    )

    assert alice_response.status_code == 200
    assert any(expense["id"] == alice_expense_id for expense in alice_response.json())

    # Bob tries to modify Alice's expense.
    update_response = client.put(
        f"/expenses/{alice_expense_id}",
        json={
            "name": "Changed by Bob",
            "amount": 999,
            "category": "Food",
            "date": "2026-11-05",
        },
        headers=bob_headers,
    )

    assert update_response.status_code == 404

    # Verify Alice's expense was not modified.
    alice_response = client.get(
        "/expenses",
        headers=alice_headers,
    )

    assert alice_response.status_code == 200

    alice_expense = next(
        expense
        for expense in alice_response.json()
        if expense["id"] == alice_expense_id
    )

    assert alice_expense["name"] == "Alice's private expense"
    assert alice_expense["amount"] == 50
