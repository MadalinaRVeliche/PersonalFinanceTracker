from datetime import datetime, timezone

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from backend.models import Expense, Income, User


def cleanup_expired_demo_accounts(db: Session) -> int:
    now = datetime.now(timezone.utc)

    expired_ids = list(
        db.scalars(
            select(User.id).where(
                User.is_demo.is_(True),
                or_(
                    User.demo_expires_at.is_(None),
                    User.demo_expires_at <= now,
                ),
            )
        )
    )

    if not expired_ids:
        return 0

    db.execute(delete(Expense).where(Expense.owner_id.in_(expired_ids)))

    db.execute(delete(Income).where(Income.owner_id.in_(expired_ids)))

    db.execute(
        delete(User).where(
            User.id.in_(expired_ids),
            User.is_demo.is_(True),
        )
    )

    db.commit()

    return len(expired_ids)
