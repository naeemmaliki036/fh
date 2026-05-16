"""Property attribute enums — added in migration 0039.

Split from enums.py to stay within the 300-LOC-per-file limit.
Re-exported from enums.py so all existing import paths stay valid.
"""

import enum


class FurnishingStatus(str, enum.Enum):
    FURNISHED = "furnished"
    SEMI_FURNISHED = "semi_furnished"
    UNFURNISHED = "unfurnished"


class CompletionStatus(str, enum.Enum):
    READY = "ready"
    OFF_PLAN = "off_plan"


class OwnershipType(str, enum.Enum):
    FREEHOLD = "freehold"
    LEASEHOLD = "leasehold"
    GCC_ONLY = "gcc_only"


class ViewOrientation(str, enum.Enum):
    SEA = "sea"
    MARINA = "marina"
    CANAL = "canal"
    LAKE = "lake"
    CREEK = "creek"
    CITY = "city"
    GARDEN = "garden"
    POOL = "pool"
    GOLF = "golf"
    LANDMARK = "landmark"
    PARTIAL = "partial"
    NONE = "none"


class FitOutStatus(str, enum.Enum):
    FITTED = "fitted"
    SHELL_AND_CORE = "shell_and_core"
    PARTIALLY_FITTED = "partially_fitted"
