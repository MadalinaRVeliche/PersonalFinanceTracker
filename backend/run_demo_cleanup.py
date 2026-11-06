from backend.database import SessionLocal
from backend.demo_cleanup import cleanup_expired_demo_accounts
from backend.demo_rate_limit import cleanup_old_demo_requests


def main():
    with SessionLocal() as db:
        deleted = cleanup_expired_demo_accounts(db)
        cleanup_old_demo_requests(db)
        db.commit()

    print(f"Cleanup complete. Removed {deleted} expired demo accounts.")


if __name__ == "__main__":
    main()
