"""Pydantic v2 schema for the public_site_config JSONB blob.

Stored on tenants.public_site_config. All top-level sections are optional
so a fresh tenant with an empty {} works without any seed data.
Validation is conservative: invalid URLs or color values are rejected;
empty strings are coerced to None; unknown keys at the top level are ignored
(extra="ignore") so forward-compatibility is preserved.
"""

import re
from typing import Annotated

from pydantic import BaseModel, Field, field_validator, model_validator

_HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
_E164_DIGIT_RE = re.compile(r"^\+?\d+$")


def _require_https(v: str | None) -> str | None:
    """Coerce empty string → None; reject non-https schemes."""
    if v is None:
        return None
    v = v.strip()
    if v == "":
        return None
    if not v.startswith("https://"):
        raise ValueError("URL must start with https://")
    return v


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------


class HeroConfig(BaseModel):
    model_config = {"extra": "ignore"}

    headline: str | None = Field(None, max_length=200)
    subheadline: str | None = Field(None, max_length=500)
    eyebrow: str | None = Field(None, max_length=100)
    image_url: str | None = None

    @field_validator("image_url", mode="before")
    @classmethod
    def _validate_image_url(cls, v: str | None) -> str | None:
        return _require_https(v)


class ThemeConfig(BaseModel):
    model_config = {"extra": "ignore"}

    primary_color: str | None = None
    accent_color: str | None = None

    @field_validator("primary_color", "accent_color", mode="before")
    @classmethod
    def _validate_hex_color(cls, v: str | None) -> str | None:
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        if not isinstance(v, str) or not _HEX_RE.match(v):
            raise ValueError("Color must be a valid hex code: #RGB or #RRGGBB")
        return v


class ServiceCard(BaseModel):
    model_config = {"extra": "ignore"}

    title: str = Field(..., max_length=80)
    description: str = Field(..., max_length=300)


class ServicesConfig(BaseModel):
    model_config = {"extra": "ignore"}

    enabled: bool = True
    title: str | None = Field(None, max_length=120)
    subtitle: str | None = Field(None, max_length=300)
    cards: list[ServiceCard] | None = None

    @field_validator("cards", mode="before")
    @classmethod
    def _validate_cards_length(
        cls, v: list | None
    ) -> list | None:
        if v is None:
            return None
        if len(v) != 4:
            raise ValueError("services.cards must contain exactly 4 items")
        return v


class FooterConfig(BaseModel):
    model_config = {"extra": "ignore"}

    description: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=200)
    instagram_url: str | None = None
    facebook_url: str | None = None
    linkedin_url: str | None = None

    @field_validator("instagram_url", "facebook_url", "linkedin_url", mode="before")
    @classmethod
    def _validate_social_urls(cls, v: str | None) -> str | None:
        return _require_https(v)


class SectionsConfig(BaseModel):
    model_config = {"extra": "ignore"}

    services_enabled: bool = True
    team_enabled: bool = True
    contact_enabled: bool = True


class TeamMember(BaseModel):
    model_config = {"extra": "ignore"}

    name: str = Field(..., max_length=120)
    title: str = Field(..., max_length=120)
    photo_url: str | None = None
    phone: str | None = Field(None, max_length=40)
    email: str | None = Field(None, max_length=200)
    linkedin_url: str | None = None

    @field_validator("photo_url", "linkedin_url", mode="before")
    @classmethod
    def _validate_team_urls(cls, v: str | None) -> str | None:
        return _require_https(v)


class TeamConfig(BaseModel):
    model_config = {"extra": "ignore"}

    title: str | None = Field(None, max_length=120)
    subtitle: str | None = Field(None, max_length=300)
    members: list[TeamMember] = Field(default_factory=list, max_length=30)
    show_agents: bool = True


class ContactSectionConfig(BaseModel):
    model_config = {"extra": "ignore"}

    title: str | None = Field(None, max_length=80)
    headline: str | None = Field(None, max_length=200)
    whatsapp: str | None = None

    @field_validator("whatsapp", mode="before")
    @classmethod
    def _validate_whatsapp(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().replace(" ", "")
        if v == "":
            return None
        if not _E164_DIGIT_RE.match(v):
            raise ValueError(
                "whatsapp must be digits only, optionally prefixed with +"
            )
        return v


# ---------------------------------------------------------------------------
# Root config schema
# ---------------------------------------------------------------------------


class PublicSiteConfig(BaseModel):
    """Root validator for tenants.public_site_config JSONB.

    All sections are optional; defaults produce a working public site.
    Use model_dump(exclude_none=False) to persist — None values are stored
    explicitly so the frontend always gets a predictable shape.
    """

    model_config = {"extra": "ignore"}

    hero: HeroConfig | None = None
    theme: ThemeConfig | None = None
    services: ServicesConfig | None = None
    team: TeamConfig | None = None
    footer: FooterConfig | None = None
    sections: SectionsConfig | None = None
    contact: ContactSectionConfig | None = None
