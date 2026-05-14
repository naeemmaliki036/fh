"""Public-site visibility resolver.

Single-responsibility helper: given a Tenant ORM object, return its effective
visibility state as one of three string literals.

  "disabled"    — public site is completely off (404 on all public endpoints)
  "direct_only" — only the listing-detail URL resolves; index/profile/agents/leads → 404
  "public"      — full public access

Enforcement matrix (called from PublicSiteService._resolve_tenant):

  Endpoint                          disabled  direct_only  public
  GET /public/sites/{slug}           404       404          200
  GET /public/sites/{slug}/listings  404       404          200
  GET /public/sites/{slug}/listings/{id} 404  200          200
  GET /public/sites/{slug}/agents    404       404          200
  POST /public/sites/{slug}/leads    404       404          200

Suspension (410) is enforced separately and wins over all visibility states.
"""

from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from apps.api.models.tenant import Tenant

Visibility = Literal["disabled", "direct_only", "public"]


def resolve_visibility(tenant: "Tenant") -> Visibility:
    """Return the effective public-site visibility for *tenant*.

    Two boolean gates combine with one fine-grain modifier:
    - platform gate: ``public_site_feature_enabled``
    - tenant gate:   ``public_site_enabled``
    - fine-grain:    ``public_site_direct_links_only``
    """
    if not tenant.public_site_feature_enabled:
        return "disabled"
    if not tenant.public_site_enabled:
        return "disabled"
    if tenant.public_site_direct_links_only:
        return "direct_only"
    return "public"
