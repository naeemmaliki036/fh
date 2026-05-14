"""tenant_media_limits

Revision ID: 0030_tenant_media_limits
Revises: 0029_listing_short_description
Create Date: 2026-05-14 00:00:00.000000

Adds four per-tenant media-cap columns to ``tenants``.
Floors are enforced via CHECK constraints — platform admins can raise caps
but never lower them below the floor values.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0030_tenant_media_limits"
down_revision: Union[str, None] = "0029_listing_short_description"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Floors — must match MEDIA_LIMITS_FLOOR in the service layer.
_FLOOR_IMAGES = 20
_FLOOR_VIDEOS = 2
_FLOOR_IMAGE_MB = 10
_FLOOR_VIDEO_MB = 25


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "max_images_per_property",
            sa.Integer,
            nullable=False,
            server_default=str(_FLOOR_IMAGES),
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "max_videos_per_property",
            sa.Integer,
            nullable=False,
            server_default=str(_FLOOR_VIDEOS),
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "max_image_mb",
            sa.Integer,
            nullable=False,
            server_default=str(_FLOOR_IMAGE_MB),
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "max_video_mb",
            sa.Integer,
            nullable=False,
            server_default=str(_FLOOR_VIDEO_MB),
        ),
    )

    op.create_check_constraint(
        "ck_tenants_max_images_floor",
        "tenants",
        f"max_images_per_property >= {_FLOOR_IMAGES}",
    )
    op.create_check_constraint(
        "ck_tenants_max_videos_floor",
        "tenants",
        f"max_videos_per_property >= {_FLOOR_VIDEOS}",
    )
    op.create_check_constraint(
        "ck_tenants_max_image_mb_floor",
        "tenants",
        f"max_image_mb >= {_FLOOR_IMAGE_MB}",
    )
    op.create_check_constraint(
        "ck_tenants_max_video_mb_floor",
        "tenants",
        f"max_video_mb >= {_FLOOR_VIDEO_MB}",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tenants_max_video_mb_floor", "tenants", type_="check")
    op.drop_constraint("ck_tenants_max_image_mb_floor", "tenants", type_="check")
    op.drop_constraint("ck_tenants_max_videos_floor", "tenants", type_="check")
    op.drop_constraint("ck_tenants_max_images_floor", "tenants", type_="check")
    op.drop_column("tenants", "max_video_mb")
    op.drop_column("tenants", "max_image_mb")
    op.drop_column("tenants", "max_videos_per_property")
    op.drop_column("tenants", "max_images_per_property")
