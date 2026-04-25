"""BaseService — all domain services extend this."""

from sqlalchemy.ext.asyncio import AsyncSession


class BaseService:
    """Accepts an AsyncSession injected via FastAPI Depends."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
