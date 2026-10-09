"""
Q&A and Citation Pydantic Schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CitationRead(BaseModel):
    filename: str
    page_number: int
    excerpt: str
    similarity_score: Optional[float] = None


class AskRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None  # Optional: scope to a single document


class AskResponse(BaseModel):
    answer: str
    citations: List[CitationRead]
    key_takeaways: List[str]
    follow_up_questions: List[str]
    question_id: Optional[uuid.UUID] = None


class QuestionHistoryItem(BaseModel):
    id: uuid.UUID
    document_id: Optional[str] = None
    question_text: str
    answer_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
