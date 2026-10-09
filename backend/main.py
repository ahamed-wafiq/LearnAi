"""
Learn AI RAG Backend — FastAPI application with persistent PostgreSQL layer.

Endpoints:
  POST   /api/upload          Upload a PDF, extract, chunk, embed, index, persist to PostgreSQL
  GET    /api/documents       List all uploaded & indexed documents from PostgreSQL
  DELETE /api/documents/{id}  Remove a document, chunks, citations from PostgreSQL and FAISS
  POST   /api/ask             Ask a question, generate answer, persist Q&A and citations to DB
  GET    /api/health          Comprehensive health check for FastAPI, PostgreSQL, FAISS, Embeddings, Gemini
"""

import os
import json
import uuid
import time
import asyncio
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse
import fitz
from sqlalchemy.orm import Session
from sqlalchemy import func

from config import UPLOADS_DIR, DATA_DIR
from database import get_db, SessionLocal, check_db_connection, get_or_create_dev_user
from models.document import Document, DocumentChunk, DocumentStatus
from models.qa import Question, Citation
from models.quiz import Quiz, QuizQuestion, QuizAttempt
from db_sync import sync_legacy_json_to_db
from pdf_parser import extract_text_from_pdf
from chunker import chunk_pages
import embeddings
from rag_engine import generate_answer, generate_quiz, generate_flashcards
import analytics_engine
import planner_engine
from schemas import (
    AskRequest,
    AskResponse,
    CitationRead,
    GenerateQuizRequest,
    SaveQuizResultRequest,
    HealthCheckResponse,
    FrontendDocumentResponse,
)

# ── Load .env ────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ── Legacy JSON Files (Kept for fallback & resilient storage) ────────────

DOCS_REGISTRY_FILE = DATA_DIR / "documents.json"
QUIZZES_FILE = DATA_DIR / "quizzes.json"
QUIZ_RESULTS_FILE = DATA_DIR / "quiz_results.json"
FLASHCARD_DECKS_FILE = DATA_DIR / "flashcard_decks.json"
FLASHCARD_PROGRESS_FILE = DATA_DIR / "flashcard_progress.json"


def _load_json_file(file_path: Path, default):
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default
    return default


def _save_json_file(file_path: Path, data):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load_docs_registry() -> list[dict]:
    return _load_json_file(DOCS_REGISTRY_FILE, [])


def _save_docs_registry(docs: list[dict]) -> None:
    _save_json_file(DOCS_REGISTRY_FILE, docs)


# ── App lifecycle ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[startup] Initializing Learn AI Backend...")
    db_status = check_db_connection()
    if db_status["status"] == "connected":
        print("[startup] PostgreSQL connection verified.")
        db = SessionLocal()
        try:
            get_or_create_dev_user(db)
            sync_legacy_json_to_db(db)
        except Exception as e:
            print(f"[startup] Warning during DB init/sync: {e}")
        finally:
            db.close()
    else:
        print(f"[startup] Warning: PostgreSQL not connected ({db_status.get('error')})")

    embeddings.ensure_index_loaded()
    yield
    # Shutdown (cleanup)


app = FastAPI(
    title="Learn AI RAG API",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS — allow the Vite dev server ─────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:8080", "http://127.0.0.1:8080",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Request Models for Flashcards & Planner ────────────────────

from pydantic import BaseModel

class GenerateFlashcardsRequest(BaseModel):
    doc_id: str | None = None
    num_cards: int = 6
    difficulty: str = "medium"
    topic: str | None = None


class FlashcardProgressItem(BaseModel):
    card_id: str
    deck_id: str
    status: str  # "known" | "review" | "unreviewed"
    rating: int | None = None
    reviews_count: int = 0


class StudyGoalRequest(BaseModel):
    id: str | None = None
    title: str
    subject_name: str = "Machine Learning & AI"
    doc_id: str | None = None
    doc_name: str | None = None
    exam_date: str
    daily_study_minutes: int = 45
    target_mastery: int = 90


class TaskStatusUpdateRequest(BaseModel):
    status: str  # "completed" | "skipped" | "rescheduled" | "scheduled"
    new_date: str | None = None


# ── Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/health")
@app.get("/health")
async def health(db: Session = Depends(get_db)):
    """Comprehensive health check reporting FastAPI, PostgreSQL, FAISS, Embeddings, Gemini."""
    db_check = check_db_connection()
    stats = embeddings.get_index_stats()
    gemini_ready = bool(os.getenv("GEMINI_API_KEY"))

    docs_count = 0
    if db_check["status"] == "connected":
        try:
            docs_count = db.query(Document).count()
        except Exception:
            docs_count = stats.get("total_documents", 0)
    else:
        docs_count = stats.get("total_documents", 0)

    is_healthy = db_check["status"] == "connected" and gemini_ready
    status_str = "healthy" if is_healthy else ("degraded" if db_check["status"] != "connected" else "ok")

    return {
        "status": status_str,
        "database": db_check["status"],
        "faiss": "ready" if stats.get("total_vectors", 0) >= 0 else "unavailable",
        "embeddings": "ready",
        "gemini": "configured" if gemini_ready else "missing_key",
        "documents_count": docs_count,
        "index": stats,
        "gemini_configured": gemini_ready,
    }


@app.post("/api/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a PDF, extract text, chunk, embed in FAISS, and persist document & chunks in PostgreSQL."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    safe_name = file.filename.replace(" ", "_")
    save_path = UPLOADS_DIR / f"{doc_id}_{safe_name}"

    # Save to disk
    try:
        contents = await file.read()
        with open(save_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Extract text
    try:
        pages = extract_text_from_pdf(save_path)
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {e}")

    total_pages = len(pages)
    non_empty_pages = sum(1 for p in pages if p["text"])

    if non_empty_pages == 0:
        save_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail="This PDF contains no extractable text. It may be a scanned/image-only document.",
        )

    # Chunk
    chunks = chunk_pages(pages, filename=file.filename, doc_id=doc_id)

    # Embed and index into FAISS (assigns faiss_index_id to each chunk)
    t0 = time.time()
    num_added, faiss_ids = embeddings.add_chunks(chunks)
    embed_time = round(time.time() - t0, 2)

    # Persist in PostgreSQL
    file_size_bytes = len(contents)
    file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
    dev_user = get_or_create_dev_user(db)

    doc_entity = Document(
        id=doc_id,
        user_id=dev_user.id,
        filename=file.filename,
        original_filename=file.filename,
        file_path=str(save_path),
        file_size=file_size_bytes,
        page_count=total_pages,
        chunk_count=len(chunks),
        status=DocumentStatus.READY.value,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        indexed_at=datetime.utcnow(),
    )
    db.add(doc_entity)
    db.flush()

    for c in chunks:
        chunk_entity = DocumentChunk(
            document_id=doc_id,
            chunk_id=c["chunk_id"],
            page_number=c["page_number"],
            text=c["text"],
            start_offset=c.get("start_offset", 0),
            end_offset=c.get("end_offset", len(c["text"])),
            faiss_index_id=c.get("faiss_index_id"),
            created_at=datetime.utcnow(),
        )
        db.add(chunk_entity)

    db.commit()

    # Legacy JSON mirror for dual-layer safety
    legacy_record = {
        "id": doc_id,
        "filename": file.filename,
        "file_path": str(save_path),
        "file_size_mb": file_size_mb,
        "total_pages": total_pages,
        "non_empty_pages": non_empty_pages,
        "chunks_count": len(chunks),
        "upload_time": doc_entity.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "ready",
    }
    legacy_docs = _load_docs_registry()
    legacy_docs.append(legacy_record)
    _save_docs_registry(legacy_docs)

    return {
        "message": f"Successfully processed '{file.filename}'",
        "document": legacy_record,
        "processing": {
            "pages_extracted": total_pages,
            "chunks_created": len(chunks),
            "vectors_added": num_added,
            "embedding_time_sec": embed_time,
        },
    }


@app.get("/api/documents")
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded and indexed documents from PostgreSQL."""
    try:
        docs = db.query(Document).order_by(Document.created_at.desc()).all()
        result = []
        for d in docs:
            result.append({
                "id": d.id,
                "filename": d.filename,
                "file_path": d.file_path,
                "file_size_mb": round(d.file_size / (1024 * 1024), 2) if d.file_size else 0.0,
                "total_pages": d.page_count,
                "non_empty_pages": d.page_count,
                "chunks_count": d.chunk_count,
                "upload_time": d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else "",
                "status": d.status.lower(),
            })
        return {"documents": result}
    except Exception as e:
        print(f"[documents] DB query error, falling back to JSON: {e}")
        return {"documents": _load_docs_registry()}


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """Remove a document, its file, and its chunks from PostgreSQL and FAISS."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        # Check legacy JSON fallback
        legacy_docs = _load_docs_registry()
        legacy_doc = next((d for d in legacy_docs if d["id"] == doc_id), None)
        if not legacy_doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        filename = legacy_doc["filename"]
        file_path = Path(legacy_doc["file_path"])
    else:
        filename = doc.filename
        file_path = Path(doc.file_path)

    # 1. Remove from FAISS index and get remaining chunk metadata
    removed, remaining_chunks = embeddings.remove_document(doc_id)

    # 2. Update remaining chunks' faiss_index_id in PostgreSQL
    if remaining_chunks:
        for c in remaining_chunks:
            db.query(DocumentChunk).filter(
                DocumentChunk.chunk_id == c.get("chunk_id")
            ).update({"faiss_index_id": c.get("faiss_index_id")})

    # 3. Delete Document record from PostgreSQL (cascades to chunks, questions, citations)
    if doc:
        db.delete(doc)
        db.commit()

    # 4. Remove physical file from disk
    file_path.unlink(missing_ok=True)

    # 5. Clean up legacy JSON
    legacy_docs = [d for d in _load_docs_registry() if d["id"] != doc_id]
    _save_docs_registry(legacy_docs)

    return {
        "message": f"Deleted '{filename}'",
        "chunks_removed": removed,
    }


@app.get("/api/documents/{doc_id}/page/{page_number}")
async def get_document_page_image(
    doc_id: str,
    page_number: int,
    dpi: int = 150,
    db: Session = Depends(get_db),
):
    """Render a specific PDF page as a PNG image."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    file_path = None
    if doc:
        file_path = Path(doc.file_path)
    else:
        legacy_docs = _load_docs_registry()
        legacy_doc = next((d for d in legacy_docs if d["id"] == doc_id), None)
        if legacy_doc:
            file_path = Path(legacy_doc["file_path"])

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found.")

    try:
        pdf = fitz.open(str(file_path))
        if page_number < 1 or page_number > len(pdf):
            pdf.close()
            raise HTTPException(
                status_code=400,
                detail=f"Page number {page_number} is out of range (1 to {len(pdf)})."
            )
        page = pdf[page_number - 1]
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        pdf.close()
        return Response(content=img_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render page: {e}")


@app.get("/api/documents/{doc_id}/page/{page_number}/text")
async def get_document_page_text(
    doc_id: str,
    page_number: int,
    db: Session = Depends(get_db),
):
    """Retrieve raw text from a specific PDF page."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    file_path = None
    if doc:
        file_path = Path(doc.file_path)
    else:
        legacy_docs = _load_docs_registry()
        legacy_doc = next((d for d in legacy_docs if d["id"] == doc_id), None)
        if legacy_doc:
            file_path = Path(legacy_doc["file_path"])

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Document file not found.")

    try:
        pdf = fitz.open(str(file_path))
        if page_number < 1 or page_number > len(pdf):
            pdf.close()
            raise HTTPException(
                status_code=400,
                detail=f"Page number {page_number} is out of range (1 to {len(pdf)})."
            )
        page = pdf[page_number - 1]
        text = page.get_text("text").strip()
        pdf.close()
        return {"page_number": page_number, "text": text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get page text: {e}")


@app.get("/api/documents/{doc_id}/pdf")
async def get_document_pdf(doc_id: str, db: Session = Depends(get_db)):
    """Stream or download the original uploaded PDF file."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    file_path = None
    filename = "document.pdf"
    if doc:
        file_path = Path(doc.file_path)
        filename = doc.filename
    else:
        legacy_docs = _load_docs_registry()
        legacy_doc = next((d for d in legacy_docs if d["id"] == doc_id), None)
        if legacy_doc:
            file_path = Path(legacy_doc["file_path"])
            filename = legacy_doc["filename"]

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename,
    )


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(req: AskRequest, db: Session = Depends(get_db)):
    """Ask a question against indexed documents using RAG, saving Q&A and citations to PostgreSQL."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Check documents existence
    has_docs = False
    try:
        has_docs = db.query(Document).count() > 0
    except Exception:
        has_docs = len(_load_docs_registry()) > 0

    if not has_docs:
        raise HTTPException(
            status_code=400,
            detail="No documents have been uploaded yet. Please upload a PDF first.",
        )

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Set it in backend/.env",
        )

    # Retrieve relevant chunks from FAISS
    results = embeddings.search(req.question, top_k=5)

    # Optionally filter to a specific document
    if req.doc_id:
        results = [r for r in results if r.get("doc_id") == req.doc_id]

    if not results:
        return AskResponse(
            answer="I couldn't find any relevant content in the uploaded documents to answer this question. "
                   "Please try rephrasing your question or upload additional materials.",
            citations=[],
            key_takeaways=[],
            follow_up_questions=[],
        )

    # Generate answer with Gemini
    try:
        response = await asyncio.to_thread(generate_answer, req.question, results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

    # Persist Q&A and citations in PostgreSQL
    question_id = None
    try:
        dev_user = get_or_create_dev_user(db)
        matched_doc_id = req.doc_id or (results[0].get("doc_id") if results else None)

        question_entity = Question(
            user_id=dev_user.id,
            document_id=matched_doc_id,
            question_text=req.question,
            answer_text=response.get("answer", ""),
            key_takeaways=response.get("key_takeaways", []),
            follow_up_questions=response.get("follow_up_questions", []),
            created_at=datetime.utcnow(),
        )
        db.add(question_entity)
        db.flush()
        question_id = question_entity.id

        # Save Citations
        citations_data = response.get("citations", [])
        for c in citations_data:
            # Match citation back to chunk metadata
            c_page = c.get("page_number", 1)
            matching_chunk = next(
                (r for r in results if r.get("page_number") == c_page),
                results[0] if results else None,
            )
            c_chunk_id = matching_chunk.get("chunk_id", "chunk_0") if matching_chunk else "chunk_0"
            c_doc_id = matching_chunk.get("doc_id", matched_doc_id or "doc_unknown") if matching_chunk else (matched_doc_id or "doc_unknown")

            citation_entity = Citation(
                question_id=question_entity.id,
                document_id=c_doc_id,
                chunk_id=c_chunk_id,
                page_number=c_page,
                quote=c.get("excerpt", ""),
                similarity_score=float(matching_chunk.get("score", 0.0)) if matching_chunk else 0.0,
                created_at=datetime.utcnow(),
            )
            db.add(citation_entity)

        db.commit()
    except Exception as e:
        print(f"[ask] Note: Question persistence skipped or failed: {e}")

    return AskResponse(
        answer=response.get("answer", ""),
        citations=[
            CitationRead(
                filename=c.get("filename", ""),
                page_number=c.get("page_number", 1),
                excerpt=c.get("excerpt", ""),
                similarity_score=c.get("similarity_score"),
            )
            for c in response.get("citations", [])
        ],
        key_takeaways=response.get("key_takeaways", []),
        follow_up_questions=response.get("follow_up_questions", []),
        question_id=question_id,
    )


# ── Practice & Quiz Endpoints ────────────────────────────────────────────

@app.post("/api/practice/generate")
async def create_quiz(req: GenerateQuizRequest, db: Session = Depends(get_db)):
    """Generate multiple-choice quiz questions grounded in uploaded document chunks."""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    doc_info = None
    if req.doc_id:
        doc = db.query(Document).filter(Document.id == req.doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Selected document not found.")
        doc_info = {"filename": doc.filename, "id": doc.id}

    chunks = embeddings.get_document_chunks(req.doc_id)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No text chunks found for the selected document. Ensure the PDF contains readable text.",
        )

    try:
        quiz_data = await asyncio.to_thread(
            generate_quiz,
            chunks,
            num_questions=req.num_questions,
            difficulty=req.difficulty,
            topic=req.topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {e}")

    quiz_id = f"quiz-{uuid.uuid4().hex[:8]}"
    doc_name = doc_info["filename"] if doc_info else "All Documents"
    record = {
        "id": quiz_id,
        "doc_id": req.doc_id,
        "doc_name": doc_name,
        "difficulty": req.difficulty,
        "topic": req.topic or f"Concepts from {doc_name}",
        "questions": quiz_data["questions"],
        "total_questions": len(quiz_data["questions"]),
        "created_at": time.time(),
    }

    # Save to JSON
    quizzes = _load_json_file(QUIZZES_FILE, [])
    quizzes.insert(0, record)
    _save_json_file(QUIZZES_FILE, quizzes)

    # Also persist to PostgreSQL
    try:
        dev_user = get_or_create_dev_user(db)
        quiz_entity = Quiz(
            user_id=dev_user.id,
            document_id=req.doc_id,
            title=record["topic"],
            topic=req.topic,
            difficulty=req.difficulty,
            created_at=datetime.utcnow(),
        )
        db.add(quiz_entity)
        db.flush()

        for q in quiz_data["questions"]:
            qq_entity = QuizQuestion(
                quiz_id=quiz_entity.id,
                question_text=q["question"],
                options=q["options"],
                correct_answer=q["options"][q["correct_index"]] if q["correct_index"] < len(q["options"]) else "",
                correct_index=q["correct_index"],
                explanation=q.get("explanation"),
                source_chunk_id=q.get("source_chunk_id"),
                created_at=datetime.utcnow(),
            )
            db.add(qq_entity)
        db.commit()
    except Exception as e:
        print(f"[quiz] DB persistence note: {e}")

    return record


@app.get("/api/practice/quizzes")
async def list_quizzes(doc_id: str | None = None):
    """List previously generated quizzes."""
    quizzes = _load_json_file(QUIZZES_FILE, [])
    if doc_id:
        quizzes = [q for q in quizzes if q.get("doc_id") == doc_id]
    return quizzes


@app.post("/api/practice/results")
async def record_quiz_result(req: SaveQuizResultRequest, db: Session = Depends(get_db)):
    """Save user quiz attempt and score."""
    result_id = f"res-{uuid.uuid4().hex[:8]}"
    record = {
        "id": result_id,
        "quiz_id": req.quiz_id,
        "doc_id": req.doc_id,
        "doc_name": req.doc_name or "General",
        "score": req.score,
        "total": req.total,
        "percentage": req.percentage,
        "time_taken_seconds": req.time_taken_seconds,
        "user_answers": req.user_answers,
        "questions": req.questions,
        "completed_at": time.time(),
    }

    results = _load_json_file(QUIZ_RESULTS_FILE, [])
    results.insert(0, record)
    _save_json_file(QUIZ_RESULTS_FILE, results)

    return record


@app.get("/api/practice/results")
async def list_quiz_results():
    """Get all completed quiz attempts."""
    results = _load_json_file(QUIZ_RESULTS_FILE, [])
    return results


# ── Flashcard Endpoints ──────────────────────────────────────────────────

@app.post("/api/flashcards/generate")
async def create_flashcards(req: GenerateFlashcardsRequest, db: Session = Depends(get_db)):
    """Generate study flashcards grounded in uploaded document chunks."""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    doc_info = None
    if req.doc_id:
        doc = db.query(Document).filter(Document.id == req.doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Selected document not found.")
        doc_info = {"filename": doc.filename, "id": doc.id}

    chunks = embeddings.get_document_chunks(req.doc_id)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No text chunks found for the selected document. Ensure the PDF contains readable text.",
        )

    try:
        card_data = await asyncio.to_thread(
            generate_flashcards,
            chunks,
            num_cards=req.num_cards,
            difficulty=req.difficulty,
            topic=req.topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation error: {e}")

    deck_id = f"deck-{uuid.uuid4().hex[:8]}"
    doc_name = doc_info["filename"] if doc_info else "All Documents"
    record = {
        "id": deck_id,
        "doc_id": req.doc_id,
        "doc_name": doc_name,
        "title": req.topic or f"Flashcards: {doc_name}",
        "difficulty": req.difficulty,
        "cards": card_data["flashcards"],
        "total_cards": len(card_data["flashcards"]),
        "created_at": time.time(),
    }

    decks = _load_json_file(FLASHCARD_DECKS_FILE, [])
    decks.insert(0, record)
    _save_json_file(FLASHCARD_DECKS_FILE, decks)

    return record


@app.get("/api/flashcards/decks")
async def list_flashcard_decks(doc_id: str | None = None):
    """List all generated flashcard decks."""
    decks = _load_json_file(FLASHCARD_DECKS_FILE, [])
    if doc_id:
        decks = [d for d in decks if d.get("doc_id") == doc_id]
    return decks


@app.post("/api/flashcards/progress")
async def update_flashcard_progress(item: FlashcardProgressItem):
    """Save mastery rating (known / review) for a flashcard."""
    progress = _load_json_file(FLASHCARD_PROGRESS_FILE, {})

    current = progress.get(item.card_id, {
        "card_id": item.card_id,
        "deck_id": item.deck_id,
        "reviews_count": 0,
    })

    current["deck_id"] = item.deck_id
    current["status"] = item.status
    current["rating"] = item.rating
    current["reviews_count"] = current.get("reviews_count", 0) + 1
    current["last_reviewed_at"] = time.time()

    progress[item.card_id] = current
    _save_json_file(FLASHCARD_PROGRESS_FILE, progress)

    return current


@app.get("/api/flashcards/progress")
async def get_flashcard_progress(deck_id: str | None = None):
    """Get flashcard learning progress map."""
    progress = _load_json_file(FLASHCARD_PROGRESS_FILE, {})
    if deck_id:
        return {k: v for k, v in progress.items() if v.get("deck_id") == deck_id}
    return progress


# ── ML Learning Analytics & Spaced Repetition Endpoints ──────────────────

@app.get("/api/analytics")
async def get_learning_analytics():
    """Retrieve computed topic mastery, weakness predictions, and trends."""
    return analytics_engine.compute_learning_analytics()


@app.get("/api/analytics/revisions")
async def get_revision_schedule():
    """Retrieve personalized revision recommendations and spaced-repetition flashcards."""
    analytics = analytics_engine.compute_learning_analytics()
    return {
        "revision_tasks": analytics.get("revision_tasks", []),
        "spaced_repetition": analytics.get("spaced_repetition", {}),
        "weak_topics": analytics.get("weak_topics", []),
        "ml_diagnostics": analytics.get("ml_diagnostics", {}),
    }


@app.post("/api/analytics/recalculate")
async def recalculate_analytics():
    """Trigger manual re-computation of topic mastery and weakness model."""
    return analytics_engine.compute_learning_analytics()


# ── Personalized Study Planner Endpoints ─────────────────────────────────

@app.get("/api/planner/overview")
async def get_planner_overview():
    """Retrieve full study planner overview, daily checklist, and weekly calendar."""
    return planner_engine.get_planner_overview()


@app.get("/api/planner/goals")
async def list_study_goals():
    """List all saved study goals."""
    return planner_engine.get_goals()


@app.post("/api/planner/goals")
async def create_study_goal(req: StudyGoalRequest):
    """Create or update a study goal and generate an adaptive 7-day revision schedule."""
    record = planner_engine.save_goal(req.model_dump())
    return record


@app.delete("/api/planner/goals/{goal_id}")
async def delete_study_goal(goal_id: str):
    """Delete a study goal and its associated tasks."""
    planner_engine.delete_goal(goal_id)
    return {"message": "Goal deleted successfully."}


@app.get("/api/planner/tasks")
async def list_planner_tasks(goal_id: str | None = None, date: str | None = None):
    """Get planner tasks filtered by goal or date."""
    return planner_engine.get_tasks(goal_id=goal_id, date_str=date)


@app.patch("/api/planner/tasks/{task_id}")
async def update_planner_task(task_id: str, req: TaskStatusUpdateRequest):
    """Update task status (mark completed, skip, or reschedule)."""
    updated = planner_engine.update_task_status(task_id, req.status, req.new_date)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found.")
    return updated


@app.post("/api/planner/reschedule")
async def recalculate_schedule():
    """Recalculate study schedule based on updated analytics and quiz progress."""
    goals = planner_engine.get_goals()
    if not goals:
        raise HTTPException(status_code=400, detail="No active study goal found. Create a goal first.")
    new_tasks = planner_engine.generate_adaptive_schedule(goals[0])
    return {"message": "Schedule recalculated successfully", "tasks_count": len(new_tasks)}


# ── Run with: python main.py ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
