"""Simple in-memory rate limiter — no external dependencies.

Stores hit counts in a module-level dict keyed by an arbitrary string (e.g.
"<ip>:<slug>"). Counts reset automatically after `window_seconds`.

Intentionally tiny: this is a Phase-1 guard against naive abuse. It is NOT
suitable for multi-process deployments (use Redis there). For Phase 1 with a
single uvicorn worker, it is sufficient.

Max 50 LOC by CLAUDE.md non-negotiable.
"""

import time
from dataclasses import dataclass, field

_STORE: dict[str, "_Bucket"] = {}


@dataclass
class _Bucket:
    count: int = 0
    window_start: float = field(default_factory=time.monotonic)


def is_rate_limited(key: str, *, max_hits: int, window_seconds: int) -> bool:
    """Return True if `key` has exceeded `max_hits` in the current window.

    The window slides: it resets the first time a key is seen after
    `window_seconds` have elapsed since the last window start.

    Args:
        key:            Arbitrary string (e.g. "<ip>:<slug>").
        max_hits:       Maximum number of allowed hits per window.
        window_seconds: Length of the window in seconds.

    Returns:
        True if the caller should be blocked; False if the hit is allowed.
    """
    now = time.monotonic()
    bucket = _STORE.get(key)

    if bucket is None or (now - bucket.window_start) >= window_seconds:
        _STORE[key] = _Bucket(count=1, window_start=now)
        return False

    bucket.count += 1
    return bucket.count > max_hits
