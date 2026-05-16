"""Public site — shared media URL helper.

Extracted so both public_site_queries.py and public_site_agent_queries.py
can import it without a circular dependency.
"""

from packages.common.storage import get_public_storage


def _media_url(storage_key: str) -> str:
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"
