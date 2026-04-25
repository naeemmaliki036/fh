"""Common storage package — public surface only."""

from .factory import get_private_storage, get_public_storage
from .interface import Storage, StoredObject

__all__ = [
    "Storage",
    "StoredObject",
    "get_public_storage",
    "get_private_storage",
]
