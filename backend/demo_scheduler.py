import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from backend.database import SessionLocal
from backend.demo_cleanup import cleanup_expired_demo_accounts
from backend.demo_rate_limit import cleanup_old_demo_requests

logger = logging.getLogger(__name__)

CLEANUP_INTERVAL_SECONDS = 15 * 60


def run_cleanup() -> None:
    with SessionLocal() as db:
        deleted = cleanup_expired_demo_accounts(db)
        cleanup_old_demo_requests(db)
        db.commit()

    if deleted:
        logger.info("Removed %s expired demo accounts", deleted)


async def cleanup_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(run_cleanup)
        except Exception:
            logger.exception("Demo cleanup failed")

        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_loop())

    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
