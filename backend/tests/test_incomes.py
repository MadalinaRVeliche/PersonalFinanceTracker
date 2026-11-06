
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(bind=test_engine)

    TestingSessionLocal = sessionmaker(bind=test_engine)

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
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def login(client, email, password="secure-password-123"):
    response = client.post(
        "/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 201

    response = client.post(
        "/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200

    return {
        "Authorization": f"Bearer {response.json()['access_token']}"
    }


def sample_income():
    return {
        "name": "Salary",
        "amount": "3500.50",
        "date": "2026-11-05",
    }


def test_income_requires_authentication(client):
    assert client.get("/incomes").status_code == 401
    assert client.post(
        "/incomes", json=sample_income()
    ).status_code == 401


def test_create_and_list_income(client):
    headers = login(client, "alice@example.com")

    response = client.post(
        "/incomes", json=sample_income(), headers=headers
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Salary"
    assert float(response.json()["amount"]) == 3500.50

    response = client.get("/incomes", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Salary"


def test_update_income(client):
    headers = login(client, "alice@example.com")

    response = client.post(
        "/incomes", json=sample_income(), headers=headers
    )
    income_id = response.json()["id"]

    updated = {
        "name": "Updated salary",
        "amount": "4000.75",
        "date": "2026-11-06",
    }

    response = client.put(
        f"/incomes/{income_id}",
        json=updated,
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated salary"
    assert float(response.json()["amount"]) == 4000.75


def test_delete_income(client):
    headers = login(client, "alice@example.com")

    response = client.post(
        "/incomes", json=sample_income(), headers=headers
    )
    income_id = response.json()["id"]

    response = client.delete(
        f"/incomes/{income_id}", headers=headers
    )

    assert response.status_code == 200

    response = client.get(
        f"/incomes/{income_id}", headers=headers
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    "amount",
    ["-10.00", "0", "12.345"],
)
def test_reject_invalid_income_amount(client, amount):
    headers = login(client, "alice@example.com")

    invalid = sample_income()
    invalid["amount"] = amount

    response = client.post(
        "/incomes", json=invalid, headers=headers
    )

    assert response.status_code == 422


def test_reject_invalid_income_date(client):
    headers = login(client, "alice@example.com")

    invalid = sample_income()
    invalid["date"] = "2026-13-45"

    response = client.post(
        "/incomes", json=invalid, headers=headers
    )

    assert response.status_code == 422


def test_users_cannot_access_each_others_income(client):
    alice = login(client, "alice@example.com")
    bob = login(client, "bob@example.com")

    response = client.post(
        "/incomes", json=sample_income(), headers=alice
    )

    assert response.status_code == 201
    income_id = response.json()["id"]

    # Bob cannot see Alice's income in his list.
    response = client.get("/incomes", headers=bob)
    assert response.status_code == 200
    assert response.json() == []

    # Bob cannot retrieve Alice's income directly.
    assert client.get(
        f"/incomes/{income_id}", headers=bob
    ).status_code == 404

    # Bob cannot modify Alice's income.
    assert client.put(
        f"/incomes/{income_id}",
        json=sample_income(),
        headers=bob,
    ).status_code == 404

    # Bob cannot delete Alice's income.
    assert client.delete(
        f"/incomes/{income_id}", headers=bob
    ).status_code == 404

    # Alice's income still exists.
    response = client.get(
        f"/incomes/{income_id}", headers=alice
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Salary"
