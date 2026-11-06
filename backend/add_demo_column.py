from sqlalchemy import inspect, text

from backend.database import engine
from backend.models import DemoRequest


def main():
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        raise RuntimeError("Users table does not exist.")

    columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "is_demo" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            print("Added users.is_demo")

        if "demo_expires_at" not in columns:
            timestamp_type = (
                "TIMESTAMP WITH TIME ZONE"
                if engine.dialect.name == "postgresql"
                else "TIMESTAMP"
            )

            connection.execute(
                text(
                    f"ALTER TABLE users " f"ADD COLUMN demo_expires_at {timestamp_type}"
                )
            )
            print("Added users.demo_expires_at")

    print("Demo schema migration complete.")

    DemoRequest.__table__.create(bind=engine, checkfirst=True)
    print("Demo rate-limit table ready.")


if __name__ == "__main__":
    main()
