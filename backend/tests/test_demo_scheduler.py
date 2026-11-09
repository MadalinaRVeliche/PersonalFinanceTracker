from unittest.mock import MagicMock, patch

from backend.demo_scheduler import run_cleanup


def test_run_cleanup_calls_both_cleanup_functions():
    db = MagicMock()
    session_context = MagicMock()
    session_context.__enter__.return_value = db

    with (
        patch(
            "backend.demo_scheduler.SessionLocal",
            return_value=session_context,
        ),
        patch(
            "backend.demo_scheduler.cleanup_expired_demo_accounts",
            return_value=2,
        ) as cleanup_accounts,
        patch(
            "backend.demo_scheduler.cleanup_old_demo_requests",
        ) as cleanup_requests,
    ):
        run_cleanup()

    cleanup_accounts.assert_called_once_with(db)
    cleanup_requests.assert_called_once_with(db)
    db.commit.assert_called_once()
