"""Template rendering helper — format_map with a safe fallback.

Missing variable references become empty strings; no exception is raised.
Used by both EmailTemplateService (test-send) and EmailOutboxService (enqueue).
"""


class _SafeDict(dict):
    """dict subclass: missing keys return an empty string instead of raising KeyError."""

    def __missing__(self, key: str) -> str:
        return ""


def render_subject(subject: str, variables: dict) -> str:
    """Render a plain-text subject template.

    Substitution syntax: {variable_name}
    Missing variables resolve to empty string.
    """
    return subject.format_map(_SafeDict(variables))


def render_body_html(body_html: str, variables: dict) -> str:
    """Render an HTML body template.

    HTML escaping is intentionally NOT applied — the stored body_html
    may contain tags and the caller is responsible for variable safety.
    Missing variables resolve to empty string.
    """
    return body_html.format_map(_SafeDict(variables))
