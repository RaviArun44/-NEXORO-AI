import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.config import settings
from app.models.knowledge import KnowledgeDoc, KnowledgeChunk
from app.schemas.knowledge import (
    KnowledgeDocResponse, KnowledgeSearchRequest, KnowledgeSearchResponse, KnowledgeChunkResponse
)
from app.services.rag_engine import rag_engine

router = APIRouter()

@router.get("/docs", response_model=List[KnowledgeDocResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    stmt = select(KnowledgeDoc).order_by(desc(KnowledgeDoc.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/upload", response_model=KnowledgeDocResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_category: str = Form("Company Policy"),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts PDF, DOCX, TXT. Extracts content, creates chunks with embeddings, and indexes for RAG.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower().replace(".", "")
    if ext not in ["pdf", "docx", "doc", "txt", "faq", "policy", "md"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: PDF, DOCX, TXT, FAQ, Policy"
        )

    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.STORAGE_DIR, "uploads", f"{file_id}_{filename}")
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    title = os.path.splitext(filename)[0].replace("_", " ").title()

    try:
        # Extract text using RAG engine
        extracted_text = rag_engine.extract_text(save_path, ext)
        chunks_data = rag_engine.chunk_text(extracted_text, chunk_size=350, overlap=50)

        doc = KnowledgeDoc(
            id=file_id,
            title=title,
            filename=filename,
            file_type=ext,
            file_size_bytes=file_size,
            file_path=save_path,
            doc_category=doc_category,
            chunks_count=len(chunks_data),
            status="INDEXED"
        )
        db.add(doc)
        await db.flush()

        # Add chunks with embeddings
        for ch in chunks_data:
            emb = rag_engine.compute_embedding(ch["content"])
            chunk_record = KnowledgeChunk(
                doc_id=doc.id,
                chunk_index=ch["chunk_index"],
                content=ch["content"],
                embedding=emb,
                token_count=ch["token_count"],
                metadata_json=ch["metadata"]
            )
            db.add(chunk_record)

        await db.commit()
        await db.refresh(doc)
        return doc

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("/docs/{doc_id}/chunks", response_model=List[KnowledgeChunkResponse])
async def list_document_chunks(doc_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(KnowledgeChunk).where(KnowledgeChunk.doc_id == doc_id).order_by(KnowledgeChunk.chunk_index.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.delete("/docs/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(KnowledgeDoc).where(KnowledgeDoc.id == doc_id)
    res = await db.execute(stmt)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Delete related chunks
    ch_stmt = select(KnowledgeChunk).where(KnowledgeChunk.doc_id == doc_id)
    ch_res = await db.execute(ch_stmt)
    for ch in ch_res.scalars().all():
        await db.delete(ch)

    await db.delete(doc)
    await db.commit()
    return {"status": "DELETED", "doc_id": doc_id}

@router.post("/test-search", response_model=KnowledgeSearchResponse)
async def test_search_knowledge(req: KnowledgeSearchRequest, db: AsyncSession = Depends(get_db)):
    """
    Diagnostic search endpoint for administrators to test RAG retrieval confidence.
    """
    stmt = select(KnowledgeChunk, KnowledgeDoc).join(KnowledgeDoc, KnowledgeChunk.doc_id == KnowledgeDoc.id)
    res = await db.execute(stmt)
    
    chunks = []
    for ch, doc in res.all():
        chunks.append({
            "id": ch.id,
            "doc_id": ch.doc_id,
            "doc_title": doc.title,
            "category": doc.doc_category,
            "content": ch.content,
            "embedding": ch.embedding
        })

    matches = rag_engine.search_relevant_chunks(
        query=req.query,
        chunks=chunks,
        top_k=req.limit,
        threshold=req.threshold or 0.35
    )

    formatted_matches = [
        {
            "chunk_id": m["chunk_id"],
            "doc_id": m["doc_id"],
            "doc_title": m["doc_title"],
            "content": m["content"],
            "similarity_score": m["similarity_score"],
            "category": m["category"]
        }
        for m in matches
    ]

    return {
        "matches": formatted_matches,
        "total_found": len(formatted_matches),
        "grounded": len(formatted_matches) > 0
    }
