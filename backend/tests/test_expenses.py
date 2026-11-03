from fastapi.testclient import TestClient
from backend.main import app, expenses

client = TestClient(app)


def test_get_expenses():
    response = client.get("/expenses")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_expense():
    original_count = len(expenses)

    new_expense = {
        "name": "Coffee",
        "amount": 5.50,
        "category": "food",
        "date": "2026-11-03"
    }

    response = client.post("/expenses", json=new_expense)

    assert response.status_code == 201
    assert response.json()["name"] == "Coffee"
    assert len(expenses) == original_count + 1

    # Clean up the expense created by this test.
    created_id = response.json()["id"]
    client.delete(f"/expenses/{created_id}")


def test_reject_negative_amount():
    invalid_expense = {
        "name": "Coffee",
        "amount": -5.50,
        "category": "food",
        "date": "2026-11-03"
    }

    response = client.post("/expenses", json=invalid_expense)

    assert response.status_code == 422


def test_reject_invalid_date():
    invalid_expense = {
        "name": "Coffee",
        "amount": 5.50,
        "category": "food",
        "date": "2026-13-45"
    }

    response = client.post("/expenses", json=invalid_expense)

    assert response.status_code == 422

def test_get_missing_expense():
    response = client.get("/expenses/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"


def test_update_expense():
    original_expense = expenses[0].copy()
    expense_id = original_expense["id"]

    updated_data = {
        "name": "Updated groceries",
        "amount": 75.00,
        "category": "food",
        "date": "2026-11-03"
    }

    try:
        response = client.put(
            f"/expenses/{expense_id}",
            json=updated_data
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated groceries"
        assert response.json()["amount"] == 75.00

    finally:
        # Restore the original expense after the test.
        expenses[0] = original_expense


def test_delete_expense():
    new_expense = {
        "name": "Temporary expense",
        "amount": 10.00,
        "category": "other",
        "date": "2026-11-03"
    }

    create_response = client.post("/expenses", json=new_expense)
    assert create_response.status_code == 201

    expense_id = create_response.json()["id"]

    delete_response = client.delete(f"/expenses/{expense_id}")

    assert delete_response.status_code == 200

    get_response = client.get(f"/expenses/{expense_id}")
    assert get_response.status_code == 404