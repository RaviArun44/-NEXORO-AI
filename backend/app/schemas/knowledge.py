from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class KnowledgeDocResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_type: str
    file_size_bytes: int
    doc_category: str
    chunks_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeChunkResponse(BaseModel):
    id: str
    doc_id: str
    chunk_index: int
    content: str
    token_count: int
    metadata_json: Dict[str, Any]

    class Config:
        from_attributes = True

class KnowledgeSearchRequest(BaseModel):
    query: str
    limit: int = 4
    threshold: Optional[float] = 0.40

class KnowledgeSearchMatch(BaseModel):
    chunk_id: str
    doc_id: str
    doc_title: str
    content: str
    similarity_score: float
    category: str

class KnowledgeSearchResponse(BaseModel):
    matches: List[KnowledgeSearchMatch]
    total_found: int
    grounded: bool

