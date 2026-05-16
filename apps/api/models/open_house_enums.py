"""Open house enums — added in migration 0041.

Split from enums.py to stay within the 300-LOC-per-file limit.
Re-exported from enums.py so all existing import paths stay valid.
"""

import enum


class OpenHouseStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
