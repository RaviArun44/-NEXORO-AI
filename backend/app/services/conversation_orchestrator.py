import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.customer import Customer
from app.models.call import Call
from app.models.product import Product
from app.models.order import Order
from app.models.appointment import Appointment
from app.models.complaint import Complaint
from app.models.knowledge import KnowledgeDoc, KnowledgeChunk
from app.services.ai_engine import ai_engine
from app.services.rag_engine import rag_engine
from app.services.language_detector import language_detector
from app.services.speech_service import speech_service

logger = logging.getLogger(__name__)

class ActiveCallSession:
    """
    Maintains in-memory state for an ongoing phone or browser voice call.
    """
    def __init__(self, call_id: str, caller_number: str, direction: str = "INBOUND"):
        self.call_id = call_id
        self.caller_number = caller_number
        self.direction = direction
        self.customer_id: Optional[str] = None
        self.customer_name: str = "Guest Caller"
        self.language: str = "en"
        self.turns: List[Dict[str, Any]] = []
        self.is_interrupted: bool = False
        self.is_transferred: bool = False
        self.start_time = datetime.utcnow()
        self.last_activity = datetime.utcnow()

class ConversationOrchestrator:
    """
    Full-duplex conversation state machine orchestrator for NEXORA AI.
    """
    def __init__(self):
        self.active_sessions: Dict[str, ActiveCallSession] = {}

    async def get_or_create_session(
        self,
        db: AsyncSession,
        call_id: str,
        caller_number: str,
        direction: str = "INBOUND"
    ) -> ActiveCallSession:
        if call_id in self.active_sessions:
            return self.active_sessions[call_id]

        session = ActiveCallSession(call_id, caller_number, direction)
        
        # Look up or auto-register customer by phone
        stmt = select(Customer).where(Customer.phone == caller_number)
        result = await db.execute(stmt)
        customer = result.scalars().first()
        
        if customer:
            session.customer_id = customer.id
            session.customer_name = customer.name
            session.language = customer.preferred_language or "en"
            customer.total_calls_count += 1
            customer.last_contacted_at = datetime.utcnow()
        else:
            # Auto-register new caller
            new_customer = Customer(
                phone=caller_number,
                name=f"Caller ({caller_number[-4:]})",
                preferred_language="en",
                total_calls_count=1,
                last_contacted_at=datetime.utcnow()
            )
            db.add(new_customer)
            await db.flush()
            session.customer_id = new_customer.id
            session.customer_name = new_customer.name

        self.active_sessions[call_id] = session
        return session

    async def process_user_turn(
        self,
        db: AsyncSession,
        call_id: str,
        user_text: str,
        forced_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a single conversational turn:
        STT Text -> Lang Detection -> Grounded RAG + DB Tool Retrieval -> LLM -> TTS metadata.
        """
        session = self.active_sessions.get(call_id)
        if not session:
            session = await self.get_or_create_session(db, call_id, "+1-800-GUEST")

        session.last_activity = datetime.utcnow()
        session.is_interrupted = False

        # 1. Detect language
        detected_lang, _ = language_detector.detect(user_text)
        current_lang = forced_language if (forced_language and forced_language != "auto") else detected_lang
        session.language = current_lang

        # Record customer turn
        customer_turn = {
            "speaker": "customer",
            "text": user_text,
            "timestamp": datetime.utcnow().isoformat(),
            "language": current_lang
        }
        session.turns.append(customer_turn)

        # 2. Check Database for business entities (orders, products)
        business_data = {}
        
        # Check if user mentioned order tracking
        order_match = None
        for word in user_text.upper().split():
            if "ORD-" in word:
                order_match = word.strip(".,!?#")
                break
                
        if order_match:
            o_stmt = select(Order).where(Order.order_number == order_match)
            o_res = await db.execute(o_stmt)
            found_order = o_res.scalars().first()
            if found_order:
                business_data["order"] = {
                    "order_number": found_order.order_number,
                    "status": found_order.status,
                    "tracking_number": found_order.tracking_number,
                    "courier_name": found_order.courier_name,
                    "total_amount": float(found_order.total_amount)
                }

        # Check if user asked about a product or SKU
        p_stmt = select(Product).where(Product.is_active == True)
        p_res = await db.execute(p_stmt)
        products = p_res.scalars().all()
        for prod in products:
            if prod.name.lower() in user_text.lower() or prod.sku.lower() in user_text.lower():
                business_data["product"] = {
                    "sku": prod.sku,
                    "name": prod.name,
                    "price": float(prod.price),
                    "currency": prod.currency,
                    "stock_quantity": prod.stock_quantity
                }
                break

        # 3. Retrieve relevant Knowledge Base chunks
        grounded_context = []
        c_stmt = select(KnowledgeChunk, KnowledgeDoc).join(KnowledgeDoc, KnowledgeChunk.doc_id == KnowledgeDoc.id)
        c_res = await db.execute(c_stmt)
        all_chunks = []
        for ch, doc in c_res.all():
            all_chunks.append({
                "id": ch.id,
                "doc_id": ch.doc_id,
                "doc_title": doc.title,
                "category": doc.doc_category,
                "content": ch.content,
                "embedding": ch.embedding
            })

        if all_chunks:
            grounded_context = rag_engine.search_relevant_chunks(
                query=user_text,
                chunks=all_chunks,
                top_k=2,
                threshold=0.35
            )

        # 4. Generate Grounded AI Response
        ai_result = await ai_engine.generate_response(
            customer_query=user_text,
            conversation_history=[{"role": t["speaker"], "content": t["text"]} for t in session.turns[-4:]],
            grounded_context=grounded_context,
            business_data=business_data if business_data else None,
            forced_language=current_lang
        )

        ai_turn = {
            "speaker": "ai",
            "text": ai_result["text"],
            "timestamp": datetime.utcnow().isoformat(),
            "language": ai_result["language"],
            "grounded": ai_result["grounded"],
            "sources": ai_result.get("sources", [])
        }
        session.turns.append(ai_turn)

        # 5. Synthesize Voice payload
        tts_data = await speech_service.synthesize_speech(
            text=ai_result["text"],
            language=ai_result["language"]
        )

        return {
            "call_id": call_id,
            "reply_text": ai_result["text"],
            "language": ai_result["language"],
            "intent": ai_result["intent"],
            "grounded": ai_result["grounded"],
            "trigger_handoff": ai_result.get("trigger_handoff", False),
            "handoff_reason": ai_result.get("handoff_reason", None),
            "sources": ai_result.get("sources", []),
            "tts": tts_data,
            "turn_history": session.turns
        }

    def handle_barge_in(self, call_id: str):
        """
        Customer interrupted AI speech. Immediately halts audio output.
        """
        session = self.active_sessions.get(call_id)
        if session:
            session.is_interrupted = True
            logger.info(f"Barge-in / Interruption registered for call {call_id}")

    async def finalize_call(self, db: AsyncSession, call_id: str, outcome: str = "RESOLVED_BY_AI") -> Optional[Call]:
        """
        Finalizes call record with transcripts, AI summary, and analytics.
        """
        session = self.active_sessions.pop(call_id, None)
        
        stmt = select(Call).where(Call.id == call_id)
        result = await db.execute(stmt)
        call = result.scalars().first()
        
        if not call:
            return None

        now = datetime.utcnow()
        call.end_time = now
        call.status = "COMPLETED"
        call.outcome = outcome
        
        if session:
            call.duration_seconds = max(5, int((now - session.start_time).total_seconds()))
            call.transcript = session.turns
            
            # Generate brief summary
            if len(session.turns) >= 2:
                call.summary = f"Customer inquired about '{session.turns[0].get('text', '')[:60]}'. AI responded in {session.language.upper()} with verified business information."
            else:
                call.summary = "Brief call inquiry resolved."
        else:
            call.duration_seconds = 15

        await db.commit()
        return call

orchestrator = ConversationOrchestrator()
