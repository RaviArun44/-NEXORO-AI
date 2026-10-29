import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON
from app.core.database import Base

class KnowledgeDoc(Base):
    __tablename__ = "knowledge_docs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False) # pdf, docx, txt, faq, policy
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(500), nullable=False)
    doc_category = Column(String(100), default="General Policy")
    
    chunks_count = Column(Integer, default=0)
    status = Column(String(50), default="INDEXED") # PROCESSING, INDEXED, ERROR
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id = Column(String(36), ForeignKey("knowledge_docs.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # List of floats
    token_count = Column(Integer, default=0)
    metadata_json = Column(JSON, default=dict) # page number, section header
    
    created_at = Column(DateTime, default=datetime.utcnow)

