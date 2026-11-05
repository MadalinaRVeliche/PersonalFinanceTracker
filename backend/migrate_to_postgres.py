import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

try:
    from backend.database import DATABASE_URL
except ModuleNotFoundError:
    from database import DATABASE_URL


SQLITE_PATH = Path(__file__).resolve().parent / "finance.db"


def main():
    if not SQLITE_PATH.exists():
        raise RuntimeError("SQLite database not found.")

    if not DATABASE_URL.startswith("postgresql"):
        raise RuntimeError("DATABASE_URL must point to PostgreSQL.")

    sqlite_db = sqlite3.connect(str(SQLITE_PATH))
    sqlite_db.row_factory = sqlite3.Row

    try:
        users = [
            dict(row)
            for row in sqlite_db.execute(
                "SELECT id, email, hashed_password FROM users ORDER BY id"
            )
        ]
        expenses = [dict(row) for row in sqlite_db.execute("""
                SELECT id, name, amount, category, date, owner_id
                FROM expenses
                ORDER BY id
                """)]
    finally:
        sqlite_db.close()

    print(f"SQLite: {len(users)} users, {len(expenses)} expenses")

    engine = create_engine(DATABASE_URL)

    try:
        with engine.begin() as conn:
            existing_users = conn.execute(
                text("SELECT COUNT(*) FROM users")
            ).scalar_one()
            existing_expenses = conn.execute(
                text("SELECT COUNT(*) FROM expenses")
            ).scalar_one()

            if existing_users or existing_expenses:
                raise RuntimeError(
                    "PostgreSQL tables are not empty. "
                    "Migration stopped to prevent duplicate records."
                )

            if users:
                conn.execute(
                    text("""
                        INSERT INTO users (id, email, hashed_password)
                        VALUES (:id, :email, :hashed_password)
                        """),
                    users,
                )

            if expenses:
                conn.execute(
                    text("""
                        INSERT INTO expenses
                            (id, name, amount, category, date, owner_id)
                        VALUES
                            (:id, :name, :amount, :category, :date, :owner_id)
                        """),
                    expenses,
                )

            # PostgreSQL sequences must advance beyond imported IDs.
            for table_name in ("users", "expenses"):
                conn.execute(text(f"""
                        SELECT setval(
                            pg_get_serial_sequence(
                                '{table_name}', 'id'
                            ),
                            COALESCE(
                                (SELECT MAX(id) FROM {table_name}),
                                1
                            ),
                            (SELECT COUNT(*) > 0 FROM {table_name})
                        )
                        """))

            pg_users = conn.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
            pg_expenses = conn.execute(
                text("SELECT COUNT(*) FROM expenses")
            ).scalar_one()

            if pg_users != len(users) or pg_expenses != len(expenses):
                raise RuntimeError("Migration verification failed.")

        print(f"Migration successful: " f"{pg_users} users and {pg_expenses} expenses")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
