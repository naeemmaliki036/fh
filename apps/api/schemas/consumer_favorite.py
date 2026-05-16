"""Consumer favorite schemas."""

from pydantic import BaseModel


class FavoriteToggleResponse(BaseModel):
    favorited: bool
    favorites_count: int
