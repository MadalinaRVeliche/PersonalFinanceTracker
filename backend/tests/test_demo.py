import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.models import User
from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from backend.demo_cleanup import cleanup_expired_demo_accounts
from backend.models import Expense, Income


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
        with TestingSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client, TestingSessionLocal
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def test_demo_creates_private_account_with_sample_data(client):
    test_client, session_factory = client

    response = test_client.post("/demo")

    assert response.status_code == 201
    assert response.json()["token_type"] == "bearer"

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    incomes = test_client.get("/incomes", headers=headers)
    expenses = test_client.get("/expenses", headers=headers)

    assert incomes.status_code == 200
    assert expenses.status_code == 200
    assert len(incomes.json()) == 2
    assert len(expenses.json()) == 5

    with session_factory() as db:
        demo_users = db.scalars(select(User).where(User.is_demo.is_(True))).all()

        assert len(demo_users) == 1


def test_demo_sessions_are_isolated(client):
    test_client, _ = client

    first = test_client.post("/demo")
    second = test_client.post("/demo")

    assert first.status_code == 201
    assert second.status_code == 201

    token1 = first.json()["access_token"]
    token2 = second.json()["access_token"]

    assert token1 != token2

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    expenses1 = test_client.get("/expenses", headers=headers1)
    expenses2 = test_client.get("/expenses", headers=headers2)

    assert expenses1.status_code == 200
    assert expenses2.status_code == 200

    ids1 = {expense["id"] for expense in expenses1.json()}
    ids2 = {expense["id"] for expense in expenses2.json()}

    assert len(ids1) == 5
    assert len(ids2) == 5
    assert ids1.isdisjoint(ids2)

    other_expense_id = next(iter(ids2))

    delete_response = test_client.delete(
        f"/expenses/{other_expense_id}",
        headers=headers1,
    )

    assert delete_response.status_code == 404

    remaining = test_client.get("/expenses", headers=headers2)
    assert len(remaining.json()) == 5


def test_regular_users_are_not_marked_as_demo(client):
    test_client, session_factory = client

    registration = test_client.post(
        "/register",
        json={
            "email": "regular@example.com",
            "password": "secure-password-123",
        },
    )

    assert registration.status_code == 201

    demo_response = test_client.post("/demo")
    assert demo_response.status_code == 201

    with session_factory() as db:
        regular_count = db.scalar(
            select(func.count()).select_from(User).where(User.is_demo.is_(False))
        )

        demo_count = db.scalar(
            select(func.count()).select_from(User).where(User.is_demo.is_(True))
        )

    assert regular_count == 1
    assert demo_count == 1


def test_demo_rate_limit(client):
    test_client, _ = client

    statuses = [test_client.post("/demo").status_code for _ in range(4)]

    assert statuses == [201, 201, 201, 429]


def test_cleanup_deletes_only_expired_demo_accounts(client):
    test_client, session_factory = client

    demo_response = test_client.post("/demo")
    assert demo_response.status_code == 201

    registration = test_client.post(
        "/register",
        json={
            "email": "cleanup-regular@example.com",
            "password": "secure-password-123",
        },
    )
    assert registration.status_code in (200, 201)

    with session_factory() as db:
        demo_user = db.scalar(select(User).where(User.is_demo.is_(True)))
        regular_user = db.scalar(select(User).where(User.is_demo.is_(False)))

        assert demo_user is not None
        assert regular_user is not None

        demo_id = demo_user.id
        regular_id = regular_user.id

        demo_user.demo_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        db.commit()

        deleted = cleanup_expired_demo_accounts(db)
        assert deleted == 1

        assert db.get(User, demo_id) is None
        assert db.get(User, regular_id) is not None

        assert db.scalars(select(Income).where(Income.owner_id == demo_id)).all() == []

        assert (
            db.scalars(select(Expense).where(Expense.owner_id == demo_id)).all() == []
        )


def test_expired_demo_token_is_rejected(client):
    test_client, session_factory = client

    response = test_client.post("/demo")
    assert response.status_code == 201

    token = response.json()["access_token"]

    with session_factory() as db:
        demo_user = db.scalar(select(User).where(User.is_demo.is_(True)))

        demo_user.demo_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

    response = test_client.get(
        "/expenses",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
