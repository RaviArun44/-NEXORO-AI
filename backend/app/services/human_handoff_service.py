import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.handoff import HandoffTicket
from app.models.user import User
from app.models.call import Call
from app.models.customer import Customer

logger = logging.getLogger(__name__)

class HumanHandoffService:
    """
    Manages intelligent human handoff, agent presence, and transfer routing.
    """

    def __init__(self):
        # Connected agent WebSocket listeners for real-time dispatch alerts
        self.active_agent_sockets: List[Any] = []

    def register_agent_socket(self, ws: Any):
        self.active_agent_sockets.append(ws)

    def unregister_agent_socket(self, ws: Any):
        if ws in self.active_agent_sockets:
            self.active_agent_sockets.remove(ws)

    async def broadcast_to_agents(self, message: Dict[str, Any]):
        """
        Sends real-time transfer popup to all connected human agent dashboards.
        """
        dead_sockets = []
        for ws in self.active_agent_sockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.append(ws)
        for dead in dead_sockets:
            self.unregister_agent_socket(dead)

    async def create_handoff_request(
        self,
        db: AsyncSession,
        call_id: str,
        reason: str,
        ai_summary: str,
        context_notes: Dict[str, Any],
        target_department: str = "Customer Support"
    ) -> HandoffTicket:
        """
        Initiates a transfer ticket and broadcasts to available human staff.
        """
        # Fetch call & customer metadata
        c_stmt = select(Call).where(Call.id == call_id)
        c_res = await db.execute(c_stmt)
        call = c_res.scalars().first()

        customer_name = "Caller"
        customer_phone = call.caller_number if call else ""
        customer_id = call.customer_id if call else None
        customer_lang = call.language if call else "en"

        if customer_id:
            cust_stmt = select(Customer).where(Customer.id == customer_id)
            cust_res = await db.execute(cust_stmt)
            cust = cust_res.scalars().first()
            if cust:
                customer_name = cust.name
                customer_lang = cust.preferred_language or customer_lang

        ticket = HandoffTicket(
            call_id=call_id,
            customer_id=customer_id,
            target_department=target_department,
            reason=reason,
            ai_summary=ai_summary,
            context_notes=context_notes,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_language=customer_lang,
            status="PENDING"
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)

        # Broadcast live alert to employees
        await self.broadcast_to_agents({
            "event": "HANDOFF_ALERT",
            "ticket": {
                "id": ticket.id,
                "call_id": ticket.call_id,
                "customer_name": ticket.customer_name,
                "customer_phone": ticket.customer_phone,
                "customer_language": ticket.customer_language,
                "reason": ticket.reason,
                "ai_summary": ticket.ai_summary,
                "target_department": ticket.target_department,
                "created_at": ticket.created_at.isoformat()
            }
        })

        return ticket

    async def accept_ticket(
        self,
        db: AsyncSession,
        ticket_id: str,
        employee_id: str
    ) -> Optional[HandoffTicket]:
        """
        Employee accepts incoming transferred call.
        """
        stmt = select(HandoffTicket).where(HandoffTicket.id == ticket_id)
        res = await db.execute(stmt)
        ticket = res.scalars().first()
        if not ticket or ticket.status != "PENDING":
            return None

        ticket.status = "ACCEPTED"
        ticket.assigned_user_id = employee_id
        ticket.resolved_at = datetime.utcnow()

        # Update call record
        call_stmt = select(Call).where(Call.id == ticket.call_id)
        call_res = await db.execute(call_stmt)
        call = call_res.scalars().first()
        if call:
            call.status = "TRANSFERRED"
            call.outcome = "HANDOFF_TO_HUMAN"
            call.transferred_to_user_id = employee_id

        await db.commit()
        await db.refresh(ticket)

        # Notify other agent dashboards that ticket is claimed
        await self.broadcast_to_agents({
            "event": "HANDOFF_CLAIMED",
            "ticket_id": ticket.id,
            "assigned_user_id": employee_id
        })

        return ticket

    async def reject_ticket(
        self,
        db: AsyncSession,
        ticket_id: str,
        employee_id: str
    ) -> Optional[HandoffTicket]:
        """
        Employee rejects or returns transfer to queue.
        """
        stmt = select(HandoffTicket).where(HandoffTicket.id == ticket_id)
        res = await db.execute(stmt)
        ticket = res.scalars().first()
        if not ticket:
            return None

        ticket.status = "RETURNED"
        await db.commit()
        return ticket

human_handoff_service = HumanHandoffService()
