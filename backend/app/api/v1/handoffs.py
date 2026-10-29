from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.handoff import HandoffTicket
from app.schemas.handoff import HandoffTicketResponse, HandoffTicketUpdate
from app.services.human_handoff_service import human_handoff_service

router = APIRouter()

@router.get("", response_model=List[HandoffTicketResponse])
async def list_handoff_tickets(
    status: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(HandoffTicket).order_by(desc(HandoffTicket.created_at))
    if status:
        query = query.where(HandoffTicket.status == status)
    query = query.limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/{ticket_id}/accept", response_model=HandoffTicketResponse)
async def accept_handoff(
    ticket_id: str,
    employee_id: str = "agent-current",
    db: AsyncSession = Depends(get_db)
):
    ticket = await human_handoff_service.accept_ticket(db, ticket_id, employee_id)
    if not ticket:
        raise HTTPException(status_code=400, detail="Ticket cannot be accepted or already claimed")
    return ticket

@router.post("/{ticket_id}/reject", response_model=HandoffTicketResponse)
async def reject_handoff(
    ticket_id: str,
    employee_id: str = "agent-current",
    db: AsyncSession = Depends(get_db)
):
    ticket = await human_handoff_service.reject_ticket(db, ticket_id, employee_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.websocket("/ws/agent")
async def agent_handoff_alerts_socket(websocket: WebSocket):
    """
    WebSocket channel for the human agent dashboard.
    Receives real-time chime and notification payloads when AI routes a call to a human.
    """
    await websocket.accept()
    human_handoff_service.register_agent_socket(websocket)
    try:
        while True:
            # Keepalive ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        human_handoff_service.unregister_agent_socket(websocket)
    except Exception:
        human_handoff_service.unregister_agent_socket(websocket)
