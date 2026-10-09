"""
Schemas package initialization.
"""

from schemas.user import UserBase, UserCreate, UserRead
from schemas.document import (
    DocumentBase,
    DocumentCreate,
    DocumentRead,
    ChunkRead,
    FrontendDocumentResponse,
    DocumentListResponse,
)
from schemas.qa import AskRequest, AskResponse, CitationRead, QuestionHistoryItem
from schemas.quiz import (
    GenerateQuizRequest,
    QuizQuestionItem,
    SaveQuizResultRequest,
    QuizAttemptRead,
)
from schemas.progress import ProgressRead
from schemas.health import HealthCheckResponse

__all__ = [
    "UserBase",
    "UserCreate",
    "UserRead",
    "DocumentBase",
    "DocumentCreate",
    "DocumentRead",
    "ChunkRead",
    "FrontendDocumentResponse",
    "DocumentListResponse",
    "AskRequest",
    "AskResponse",
    "CitationRead",
    "QuestionHistoryItem",
    "GenerateQuizRequest",
    "QuizQuestionItem",
    "SaveQuizResultRequest",
    "QuizAttemptRead",
    "ProgressRead",
    "HealthCheckResponse",
]
