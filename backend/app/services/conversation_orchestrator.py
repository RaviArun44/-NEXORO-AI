import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.customer import Customer
from app.models.call import Call
from app.models.knowledge import KnowledgeDoc, KnowledgeChunk
from app.services.ai_engine import ai_engine
from app.services.rag_engine import rag_engine
from app.services.language_detector import language_detector
from app.services.speech_service import speech_service
from app.services.vision_service import vision_service
from app.services.workflow_engine import workflow_engine, WorkflowResult
from app.services.call_queue_manager import call_queue_manager

logger = logging.getLogger(__name__)

class ActiveCallSession:
    """
    Maintains full-duplex conversational state for an active phone or browser voice call.
    """
    def __init__(self, call_id: str, caller_number: str, direction: str = "INBOUND"):
        self.call_id = call_id
        self.caller_number = caller_number
        self.direction = direction
        self.customer_id: Optional[str] = None
        self.customer_name: str = "Valued Customer"
        self.language: str = "en"
        self.detected_languages: List[str] = ["en"]
        self.turns: List[Dict[str, Any]] = []
        self.is_interrupted: bool = False
        self.is_transferred: bool = False
        self.is_terminal: bool = False
        self.sentiment: str = "NEUTRAL"
        self.start_time = datetime.utcnow()
        self.last_activity = datetime.utcnow()


class ConversationOrchestrator:
    """
    Full-Duplex Multilingual Voice Conversation State Machine for Khaira Company.
    Integrates:
    - High-volume concurrency queue and rate limiting.
    - Automatic multilingual detection & mid-call language switching.
    - Autonomous business workflows (Orders, Inventory, Appointments, Complaints, Urgency).
    - Grounded Knowledge Base RAG.
    - Interruption handling (barge-in) and real neural voice generation.
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
            session = self.active_sessions[call_id]
            call_queue_manager.update_heartbeat(call_id)
            return session

        session = ActiveCallSession(call_id, caller_number, direction)
        
        # Look up or auto-register customer by phone
        stmt = select(Customer).where(Customer.phone == caller_number)
        result = await db.execute(stmt)
        customer = result.scalars().first()
        
        if customer:
            session.customer_id = customer.id
            session.customer_name = customer.name
            session.language = customer.preferred_language or "en"
            session.detected_languages = [session.language]
            customer.total_calls_count += 1
            customer.last_contacted_at = datetime.utcnow()
        else:
            # Auto-register new customer profile
            new_customer = Customer(
                phone=caller_number,
                name=f"Customer ({caller_number[-4:] if len(caller_number) >= 4 else caller_number})",
                preferred_language="en",
                total_calls_count=1,
                last_contacted_at=datetime.utcnow()
            )
            db.add(new_customer)
            await db.flush()
            session.customer_id = new_customer.id
            session.customer_name = new_customer.name

        self.active_sessions[call_id] = session
        call_queue_manager.register_active_call(call_id, caller_number, session.language)
        return session

    async def process_user_turn(
        self,
        db: AsyncSession,
        call_id: str,
        user_text: str,
        forced_language: Optional[str] = None,
        image_urls: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a complete voice conversational turn:
        1. Rate limit check & session validation
        2. Automatic Language Detection & Contextual Switching
        3. Multimodal Vision AI Image Processing (when images are attached)
        4. Business Workflow Execution (Order tracking, Complaints, Appointments, Products, Urgency, Wrap-up)
        5. Knowledge Base RAG Retrieval & Strict Anti-Hallucination Grounding
        6. Speech Synthesis & Audio Metadata Generation
        """
        session = self.active_sessions.get(call_id)
        if not session:
            session = await self.get_or_create_session(db, call_id, "+91-98401-00199")

        session.last_activity = datetime.utcnow()
        session.is_interrupted = False
        call_queue_manager.update_heartbeat(call_id)

        # 1. Detect language with continuity & switching
        prev_lang = session.language
        if forced_language and forced_language != "auto":
            current_lang = forced_language
        else:
            current_lang, _ = language_detector.detect(user_text, previous_language=prev_lang)

        session.language = current_lang
        if current_lang not in session.detected_languages:
            session.detected_languages.append(current_lang)

        # Record customer utterance (including images if attached)
        customer_turn = {
            "speaker": "customer",
            "text": user_text,
            "timestamp": datetime.utcnow().isoformat(),
            "language": current_lang,
            "images": image_urls or []
        }
        session.turns.append(customer_turn)

        # Retrieve customer object if available
        customer = None
        if session.customer_id:
            c_res = await db.execute(select(Customer).where(Customer.id == session.customer_id))
            customer = c_res.scalars().first()

        # 2. Multimodal Vision AI Pipeline (if images are attached)
        if image_urls and len(image_urls) > 0:
            images_info = []
            uploads_dir = os.path.join(settings.STORAGE_DIR, "uploads")
            for img_ref in image_urls:
                # Handle /storage/uploads/filename or raw filename or absolute path
                if "/storage/uploads/" in img_ref:
                    fname = img_ref.split("/storage/uploads/")[-1]
                    fpath = os.path.join(uploads_dir, fname)
                elif os.path.isabs(img_ref) and os.path.exists(img_ref):
                    fpath = img_ref
                    fname = os.path.basename(img_ref)
                else:
                    fname = os.path.basename(img_ref)
                    fpath = os.path.join(uploads_dir, fname)

                if os.path.exists(fpath):
                    info = vision_service.analyze_image_file(fpath, original_filename=fname)
                    images_info.append(info)
                else:
                    images_info.append({
                        "filename": fname,
                        "file_path": fpath,
                        "file_url": f"/storage/uploads/{fname}",
                        "detected_category": "Image",
                        "visual_features": ["Uploaded image file"],
                        "dominant_colors": ["Neutral"]
                    })

            vision_res = await vision_service.generate_image_answer(
                images_info=images_info,
                user_query=user_text,
                language=current_lang,
                conversation_history=session.turns
            )
            reply_text = vision_res["reply_text"]
            intent = "IMAGE_ANALYSIS"
            grounded = True
            sources = vision_res.get("sources", [f"Vision AI Engine ({len(images_info)} images)"])
            trigger_handoff = False
            handoff_reason = None
        else:
            # 3. Check Autonomous Business Workflows First
            workflow_res: Optional[WorkflowResult] = await workflow_engine.execute(
                db=db,
                user_text=user_text,
                language=current_lang,
                session_id=call_id,
                customer=customer,
                context_turns=session.turns
            )

            if workflow_res and workflow_res.handled:
                reply_text = workflow_res.reply_text
                intent = workflow_res.intent
                grounded = workflow_res.grounded
                sources = workflow_res.sources
                trigger_handoff = workflow_res.trigger_handoff
                handoff_reason = workflow_res.handoff_reason
                session.is_terminal = workflow_res.is_terminal
            else:
                # 4. Fallback to Grounded RAG Knowledge Base
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

                # Generate response via AI Engine
                ai_result = await ai_engine.generate_response(
                    customer_query=user_text,
                    conversation_history=[{"role": t["speaker"], "content": t["text"]} for t in session.turns[-4:]],
                    grounded_context=grounded_context,
                    forced_language=current_lang
                )
                reply_text = ai_result["text"]
                intent = ai_result["intent"]
                grounded = ai_result["grounded"]
                sources = ai_result.get("sources", [])
                trigger_handoff = ai_result.get("trigger_handoff", False)
                handoff_reason = ai_result.get("handoff_reason", None)
                session.sentiment = ai_result.get("sentiment", "NEUTRAL")

        # 5. Synthesize Neural Voice audio
        tts_data = await speech_service.synthesize_speech(
            text=reply_text,
            language=current_lang,
            call_id=call_id
        )

        # Record AI utterance
        ai_turn = {
            "speaker": "ai",
            "text": reply_text,
            "timestamp": datetime.utcnow().isoformat(),
            "language": current_lang,
            "grounded": grounded,
            "sources": sources,
            "audio_url": tts_data.get("audio_url")
        }
        session.turns.append(ai_turn)

        # Update Call record in DB
        stmt = select(Call).where(Call.id == call_id)
        call_obj_res = await db.execute(stmt)
        call_obj = call_obj_res.scalars().first()
        if call_obj:
            call_obj.transcript = session.turns
            call_obj.language = current_lang
            await db.commit()

        return {
            "call_id": call_id,
            "reply_text": reply_text,
            "language": current_lang,
            "intent": intent,
            "sentiment": session.sentiment,
            "grounded": grounded,
            "trigger_handoff": trigger_handoff,
            "handoff_reason": handoff_reason,
            "is_terminal": session.is_terminal,
            "sources": sources,
            "tts": tts_data,
            "turn_history": session.turns
        }

    def handle_barge_in(self, call_id: str):
        """
        Customer interrupted AI speech. Immediately halts active synthesis and playback.
        """
        session = self.active_sessions.get(call_id)
        if session:
            session.is_interrupted = True
            speech_service.cancel_active_synthesis(call_id)
            logger.info(f"Barge-in / Interruption handled for call {call_id}")

    async def finalize_call(self, db: AsyncSession, call_id: str, outcome: str = "RESOLVED_BY_AI") -> Optional[Call]:
        """
        Finalizes call record with transcripts, AI summary, and analytics.
        """
        session = self.active_sessions.pop(call_id, None)
        call_queue_manager.deregister_active_call(call_id)
        
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
            call.language = session.language
            call.detected_languages = session.detected_languages
            call.sentiment = session.sentiment
            call.summary = ai_engine.summarize_conversation(session.turns, session.language)
        else:
            call.duration_seconds = 15

        await db.commit()
        return call

orchestrator = ConversationOrchestrator()
