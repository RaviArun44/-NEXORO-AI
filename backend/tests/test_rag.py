import pytest
from app.services.rag_engine import rag_engine

def test_chunking():
    sample_text = " ".join([f"word{i}" for i in range(1000)])
    chunks = rag_engine.chunk_text(sample_text, chunk_size=300, overlap=50)
    assert len(chunks) >= 3
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["token_count"] == 300

def test_embeddings_and_search():
    doc_text_1 = "All NEXORA AI voice gateways come with a 2-year warranty and express replacement."
    doc_text_2 = "Operating business hours are Monday through Friday from 9 AM to 6 PM."
    
    vec1 = rag_engine.compute_embedding(doc_text_1)
    vec2 = rag_engine.compute_embedding(doc_text_2)
    
    assert len(vec1) == rag_engine.VECTOR_DIM
    assert len(vec2) == rag_engine.VECTOR_DIM

    chunks = [
        {"id": "c1", "doc_id": "d1", "doc_title": "Warranty Policy", "category": "Policy", "content": doc_text_1, "embedding": vec1},
        {"id": "c2", "doc_id": "d2", "doc_title": "Office Hours", "category": "Ops", "content": doc_text_2, "embedding": vec2}
    ]

    matches = rag_engine.search_relevant_chunks("What is the warranty period for voice gateway?", chunks, top_k=1, threshold=0.30)
    assert len(matches) > 0
    assert matches[0]["chunk_id"] == "c1"
