"""Shared HTTP error helpers.

Raise these from service layer — never raw HTTPException from a service.
Routers let them propagate naturally.
"""

from fastapi import HTTPException, status


def bad_request(message: str) -> HTTPException:
    """400 Bad Request."""
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


def unauthorized(message: str | dict = "Not authenticated") -> HTTPException:
    """401 Unauthorized. `message` may be a str or a JSON-serializable dict for structured errors."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(message: str = "Access denied") -> HTTPException:
    """403 Forbidden."""
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)


def not_found(resource: str = "Resource") -> HTTPException:
    """404 Not Found."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found",
    )


def conflict(message: str) -> HTTPException:
    """409 Conflict."""
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)


def locked(message: str) -> HTTPException:
    """423 Locked."""
    return HTTPException(status_code=423, detail=message)


def too_many_requests(message: str) -> HTTPException:
    """429 Too Many Requests."""
    return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)
