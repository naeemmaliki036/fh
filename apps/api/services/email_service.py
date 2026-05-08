"""Email service — thin wrapper around the Resend HTTP API.

Uses httpx directly (no SDK) so we avoid adding a new dependency.
All failures are logged and swallowed; callers must not rely on delivery.
"""

import logging

import httpx

from apps.api.config import settings

_log = logging.getLogger("fh.email")

_RESEND_ENDPOINT = "https://api.resend.com/emails"


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
) -> bool:
    """Send a transactional email via Resend.

    Returns True on success, False on any failure (network, auth, API error).
    Never raises. If RESEND_API_KEY is not set, skips and returns False.
    """
    if not settings.resend_api_key:
        _log.info("email skipped (no API key): to=%s subject=%s", to, subject)
        return False

    payload: dict[str, object] = {
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text is not None:
        payload["text"] = text

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                _RESEND_ENDPOINT,
                json=payload,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
        if resp.is_success:
            return True
        _log.warning(
            "send_email failed: status=%s body=%s to=%s",
            resp.status_code,
            resp.text[:200],
            to,
        )
        return False
    except Exception:
        _log.warning("send_email exception: to=%s subject=%s", to, subject, exc_info=True)
        return False
