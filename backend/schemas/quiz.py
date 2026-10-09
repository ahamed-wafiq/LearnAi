"""
Quiz Pydantic Schemas.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict


class GenerateQuizRequest(BaseModel):
    doc_id: Optional[str] = None
    num_questions: int = 5
    difficulty: str = "Medium"
    topic: Optional[str] = None


class QuizQuestionItem(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    filename: Optional[str] = None
    page_number: Optional[int] = None
    excerpt: Optional[str] = None


class SaveQuizResultRequest(BaseModel):
    quiz_id: str
    doc_id: Optional[str] = None
    doc_name: Optional[str] = None
    score: int
    total: int
    percentage: float
    time_taken_seconds: int = 0
    user_answers: Dict[str, int] = {}
    questions: List[Dict] = []


class QuizAttemptRead(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int
    started_at: datetime

    model_config = ConfigDict(from_attributes=True)
