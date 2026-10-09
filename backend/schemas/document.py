"""
Document & Chunk Pydantic Schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ChunkRead(BaseModel):
    id: uuid.UUID
    document_id: str
    chunk_id: str
    page_number: int
    text: str
    start_offset: int
    end_offset: int
    faiss_index_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_size: int = 0
    page_count: int = 0
    chunk_count: int = 0
    status: str = "READY"


class DocumentCreate(DocumentBase):
    id: str
    file_path: str
    user_id: Optional[uuid.UUID] = None


class DocumentRead(DocumentBase):
    id: str
    user_id: Optional[uuid.UUID] = None
    file_path: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    indexed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Frontend-compatible Document response format
class FrontendDocumentResponse(BaseModel):
    id: str
    filename: str
    file_path: str
    file_size_mb: float
    total_pages: int
    non_empty_pages: int
    chunks_count: int
    upload_time: str
    status: str


class DocumentListResponse(BaseModel):
    documents: List[FrontendDocumentResponse]
