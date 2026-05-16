"""PrivateDocument approval/review service.

Handles approve, reject, and pending-queue listing for the document
review workflow introduced in migration 0037.

Authorization model
-------------------
- company_owner / company_admin / property_admin: can approve/reject any doc
  in their tenant.
- agent: can only approve/reject docs on entities they are assigned to
  (customer.assigned_agent_id, lead.agent_id, etc.). The service checks the
  entity assignment via a lightweight lookup rather than a complex join.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.customer import Customer
from apps.api.models.enums import (
    AuditAction,
    PrivateDocumentApprovalStatus,
    PrivateDocumentEntityType,
    TenantRole,
)
from apps.api.models.private_document import PrivateDocument
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ADMIN_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}
_APPROVER_ROLES = _ADMIN_ROLES | {TenantRole.AGENT.value}


class PrivateDocumentApprovalService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _get_doc(self, document_id: UUID, tenant_id: UUID) -> PrivateDocument:
        await self._set_rls(tenant_id)
        doc = await self.session.get(PrivateDocument, document_id)
        if not doc or doc.tenant_id != tenant_id:
            raise not_found("PrivateDocument")
        return doc

    async def _check_authorization(
        self,
        doc: PrivateDocument,
        tenant_id: UUID,
        current_user: dict,
    ) -> None:
        """Raise 403 if current_user may not approve/reject this document."""
        role = current_user["role"]
        if role in _ADMIN_ROLES:
            return  # unrestricted within tenant

        if role != TenantRole.AGENT.value:
            raise forbidden("Insufficient role to approve or reject documents")

        # Agent: must be assigned to the customer who owns this document
        if doc.entity_type == PrivateDocumentEntityType.CUSTOMER:
            customer = await self.session.get(Customer, doc.entity_id)
            if customer and customer.assigned_agent_id is not None:
                # Resolve linked_user_id → agent_id comparison
                from apps.api.models.agent import Agent
                agent_stmt = select(Agent).where(
                    Agent.linked_user_id == UUID(current_user["id"]),
                    Agent.tenant_id == tenant_id,
                )
                agent = (await self.session.execute(agent_stmt)).scalar_one_or_none()
                if agent and agent.id == customer.assigned_agent_id:
                    return
        raise forbidden(
            "Agents can only approve documents on customers assigned to them"
        )

    # ------------------------------------------------------------------
    # Approve
    # ------------------------------------------------------------------

    async def approve(
        self, document_id: UUID, tenant_id: UUID, current_user: dict
    ) -> PrivateDocument:
        doc = await self._get_doc(document_id, tenant_id)
        await self._check_authorization(doc, tenant_id, current_user)

        if doc.approval_status != PrivateDocumentApprovalStatus.PENDING:
            raise bad_request(
                f"Only 'pending' documents can be approved. "
                f"Current status: '{doc.approval_status.value}'"
            )

        doc.approval_status = PrivateDocumentApprovalStatus.APPROVED
        doc.approved_by_user_id = UUID(current_user["id"])
        doc.approved_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()

        await self._audit.record(
            AuditAction.PRIVATE_DOCUMENT_APPROVED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="private_document",
            entity_id=doc.id,
            after={"entity_type": doc.entity_type.value, "entity_id": str(doc.entity_id)},
        )
        await self.session.refresh(doc)
        return doc

    # ------------------------------------------------------------------
    # Reject
    # ------------------------------------------------------------------

    async def reject(
        self, document_id: UUID, tenant_id: UUID, current_user: dict, reason: str
    ) -> PrivateDocument:
        if len(reason.strip()) < 5:
            raise bad_request("Rejection reason must be at least 5 characters")

        doc = await self._get_doc(document_id, tenant_id)
        await self._check_authorization(doc, tenant_id, current_user)

        if doc.approval_status != PrivateDocumentApprovalStatus.PENDING:
            raise bad_request(
                f"Only 'pending' documents can be rejected. "
                f"Current status: '{doc.approval_status.value}'"
            )

        doc.approval_status = PrivateDocumentApprovalStatus.REJECTED
        doc.rejected_reason = reason
        # Clear any prior approval metadata
        doc.approved_by_user_id = None
        doc.approved_at = None
        await self.session.flush()

        await self._audit.record(
            AuditAction.PRIVATE_DOCUMENT_REJECTED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="private_document",
            entity_id=doc.id,
            after={
                "entity_type": doc.entity_type.value,
                "entity_id": str(doc.entity_id),
                "reason": reason,
            },
        )
        await self.session.refresh(doc)
        return doc

    # ------------------------------------------------------------------
    # Pending queue
    # ------------------------------------------------------------------

    async def list_pending(
        self,
        tenant_id: UUID,
        current_user: dict,
        entity_type: PrivateDocumentEntityType | None,
        assigned_to_me: bool,
        skip: int,
        limit: int,
    ) -> tuple[list[PrivateDocument], int]:
        from sqlalchemy import func

        await self._set_rls(tenant_id)
        stmt = select(PrivateDocument).where(
            PrivateDocument.tenant_id == tenant_id,
            PrivateDocument.approval_status == PrivateDocumentApprovalStatus.PENDING,
        )
        if entity_type:
            stmt = stmt.where(PrivateDocument.entity_type == entity_type)

        if assigned_to_me and current_user["role"] == TenantRole.AGENT.value:
            from apps.api.models.agent import Agent
            agent_stmt = select(Agent.id).where(
                Agent.linked_user_id == UUID(current_user["id"]),
                Agent.tenant_id == tenant_id,
            )
            agent_id_row = (await self.session.execute(agent_stmt)).scalar_one_or_none()
            if agent_id_row:
                # Docs on customers assigned to this agent
                customer_ids_stmt = select(Customer.id).where(
                    Customer.assigned_agent_id == agent_id_row,
                    Customer.tenant_id == tenant_id,
                )
                customer_ids = list(
                    (await self.session.execute(customer_ids_stmt)).scalars().all()
                )
                stmt = stmt.where(
                    PrivateDocument.entity_type == PrivateDocumentEntityType.CUSTOMER,
                    PrivateDocument.entity_id.in_(customer_ids),
                )

        from sqlalchemy import func as sqlfunc

        total = (await self.session.execute(
            select(sqlfunc.count()).select_from(stmt.subquery())
        )).scalar_one()

        docs = list((await self.session.execute(
            stmt.order_by(PrivateDocument.created_at.asc()).offset(skip).limit(limit)
        )).scalars().all())
        return docs, total
