"""Background email-outbox worker.

A simple asyncio loop wired into the FastAPI app lifespan. Polls the
email_outbox every EMAIL_WORKER_INTERVAL_SECS, calls send_pending on a
short-lived session, and logs the result.

No external scheduler dependency. Good enough for a single-replica
Railway deploy; for multi-replica horizontal scale, replace with a
Redis-backed Arq/Celery worker.
"""

import asyncio
import logging

from apps.api.config import settings
from apps.api.services.email_outbox_service import EmailOutboxService
from packages.common.db.session import make_session_factory

_log = logging.getLogger("fh.email_worker")

_INTERVAL_SECS = 60
_BATCH_LIMIT = 20


async def _tick(factory) -> None:
    """One iteration of the loop: drain up to _BATCH_LIMIT queued emails."""
    async with factory() as session:
        svc = EmailOutboxService(session)
        try:
            result = await svc.send_pending(limit=_BATCH_LIMIT)
            await session.commit()
            if result.get("sent") or result.get("failed"):
                _log.info(
                    "Email worker drained: sent=%d failed=%d",
                    result.get("sent", 0),
                    result.get("failed", 0),
                )
        except Exception:
            await session.rollback()
            _log.exception("Email worker tick failed")


async def run_forever() -> None:
    """Background loop. Cancels cleanly on shutdown."""
    factory = make_session_factory(settings.database_url)
    _log.info("Email worker started (interval=%ds)", _INTERVAL_SECS)
    try:
        while True:
            await _tick(factory)
            await asyncio.sleep(_INTERVAL_SECS)
    except asyncio.CancelledError:
        _log.info("Email worker shutting down")
        raise
