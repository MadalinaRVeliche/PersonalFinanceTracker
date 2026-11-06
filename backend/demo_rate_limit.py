import hashlib
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from backend.models import DemoRequest

DEMO_LIMIT = 3
DEMO_WINDOW = timedelta(hours=1)


def check_demo_rate_limit(db: Session, client_ip: str) -> None:
    secret = os.environ.get("DEMO_RATE_LIMIT_SECRET")

    if not secret:
        raise RuntimeError("DEMO_RATE_LIMIT_SECRET must be configured")

    client_key = hashlib.sha256(f"{secret}:{client_ip}".encode()).hexdigest()

    now = datetime.now(timezone.utc)
    cutoff = now - DEMO_WINDOW

    # Serialize concurrent requests in PostgreSQL.
    if db.bind.dialect.name == "postgresql":
        db.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:key))"),
            {"key": client_key},
        )

    count = db.scalar(
        select(func.count(DemoRequest.id)).where(
            DemoRequest.client_key == client_key,
            DemoRequest.created_at > cutoff,
        )
    )

    if count >= DEMO_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Demo limit reached. Please try again later.",
        )

    db.add(DemoRequest(client_key=client_key, created_at=now))
    db.flush()


def cleanup_old_demo_requests(db: Session) -> None:
    cutoff = datetime.now(timezone.utc) - DEMO_WINDOW
    db.execute(delete(DemoRequest).where(DemoRequest.created_at <= cutoff))
