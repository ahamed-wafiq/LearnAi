"""
LearnSphere RAG Backend — FastAPI application.

Endpoints:
  POST   /api/upload          Upload a PDF, extract, chunk, embed, index
  GET    /api/documents       List all uploaded & indexed documents
  DELETE /api/documents/{id}  Remove a document and its chunks from the index
  POST   /api/ask             Ask a question against the indexed documents
  GET    /api/health          Health check / index stats
"""

import os
import json
import uuid
import time
import shutil
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse
import fitz
from pydantic import BaseModel

from config import UPLOADS_DIR, DATA_DIR
from pdf_parser import extract_text_from_pdf
from chunker import chunk_pages
import embeddings
from rag_engine import generate_answer, generate_quiz, generate_flashcards
import analytics_engine
import planner_engine

# ── Load .env ────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ── Document registry & storage (persisted as JSON) ──────────────────────

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


_documents: list[dict] = []


# ── App lifecycle ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _documents
    # Startup
    _documents = _load_docs_registry()
    embeddings.ensure_index_loaded()
    print(f"[startup] Loaded {len(_documents)} documents from registry.")
    yield
    # Shutdown (nothing special)


app = FastAPI(
    title="LearnSphere RAG API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow the Vite dev server ─────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                    "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ─────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    doc_id: str | None = None  # Optional: scope to a single document


class AskResponse(BaseModel):
    answer: str
    citations: list[dict]
    key_takeaways: list[str]
    follow_up_questions: list[str]


class GenerateQuizRequest(BaseModel):
    doc_id: str | None = None
    num_questions: int = 5
    difficulty: str = "Medium"
    topic: str | None = None


class SaveQuizResultRequest(BaseModel):
    quiz_id: str
    doc_id: str | None = None
    doc_name: str | None = None
    score: int
    total: int
    percentage: float
    time_taken_seconds: int = 0
    user_answers: dict[str, int] = {}
    questions: list[dict] = []


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
async def health():
    stats = embeddings.get_index_stats()
    return {
        "status": "ok",
        "documents_count": len(_documents),
        "index": stats,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF, extract text, chunk, embed, and index it."""
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

    # Embed and index
    t0 = time.time()
    num_added = embeddings.add_chunks(chunks)
    embed_time = round(time.time() - t0, 2)

    # Register document
    file_size_mb = round(len(contents) / (1024 * 1024), 2)
    doc_record = {
        "id": doc_id,
        "filename": file.filename,
        "file_path": str(save_path),
        "file_size_mb": file_size_mb,
        "total_pages": total_pages,
        "non_empty_pages": non_empty_pages,
        "chunks_count": len(chunks),
        "upload_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "ready",
    }
    _documents.append(doc_record)
    _save_docs_registry(_documents)

    return {
        "message": f"Successfully processed '{file.filename}'",
        "document": doc_record,
        "processing": {
            "pages_extracted": total_pages,
            "chunks_created": len(chunks),
            "vectors_added": num_added,
            "embedding_time_sec": embed_time,
        },
    }


@app.get("/api/documents")
async def list_documents():
    """List all uploaded and indexed documents."""
    return {"documents": _documents}


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Remove a document, its file, and its chunks from the index."""
    global _documents

    doc = next((d for d in _documents if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove from FAISS
    removed = embeddings.remove_document(doc_id)

    # Remove file from disk
    file_path = Path(doc["file_path"])
    file_path.unlink(missing_ok=True)

    # Remove from registry
    _documents = [d for d in _documents if d["id"] != doc_id]
    _save_docs_registry(_documents)

    return {
        "message": f"Deleted '{doc['filename']}'",
        "chunks_removed": removed,
    }


@app.get("/api/documents/{doc_id}/page/{page_number}")
async def get_document_page_image(doc_id: str, page_number: int, dpi: int = 150):
    """Render a specific PDF page as a PNG image."""
    doc = next((d for d in _documents if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

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
async def get_document_page_text(doc_id: str, page_number: int):
    """Retrieve raw text from a specific PDF page."""
    doc = next((d for d in _documents if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

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
async def get_document_pdf(doc_id: str):
    """Stream or download the original uploaded PDF file."""
    doc = next((d for d in _documents if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk.")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=doc["filename"],
    )


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    """Ask a question against the indexed documents using RAG."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not _documents:
        raise HTTPException(
            status_code=400,
            detail="No documents have been uploaded yet. Please upload a PDF first.",
        )

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Set it in backend/.env",
        )

    # Retrieve relevant chunks
    results = embeddings.search(req.question, top_k=5)

    # Optionally filter to a specific document
    if req.doc_id:
        results = [r for r in results if r["doc_id"] == req.doc_id]

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
        response = generate_answer(req.question, results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

    return AskResponse(**response)


# ── Practice & Quiz Endpoints ────────────────────────────────────────────

@app.post("/api/practice/generate")
async def create_quiz(req: GenerateQuizRequest):
    """Generate multiple-choice quiz questions grounded in uploaded document chunks."""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    if not _documents:
        raise HTTPException(status_code=400, detail="No documents uploaded yet. Please upload a PDF first.")

    doc_info = None
    if req.doc_id:
        doc_info = next((d for d in _documents if d["id"] == req.doc_id), None)
        if not doc_info:
            raise HTTPException(status_code=404, detail="Selected document not found.")

    chunks = embeddings.get_document_chunks(req.doc_id)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No text chunks found for the selected document. Ensure the PDF contains readable text.",
        )

    try:
        quiz_data = generate_quiz(
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

    quizzes = _load_json_file(QUIZZES_FILE, [])
    quizzes.insert(0, record)
    _save_json_file(QUIZZES_FILE, quizzes)

    return record


@app.get("/api/practice/quizzes")
async def list_quizzes(doc_id: str | None = None):
    """List previously generated quizzes."""
    quizzes = _load_json_file(QUIZZES_FILE, [])
    if doc_id:
        quizzes = [q for q in quizzes if q.get("doc_id") == doc_id]
    return quizzes


@app.post("/api/practice/results")
async def record_quiz_result(req: SaveQuizResultRequest):
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
async def create_flashcards(req: GenerateFlashcardsRequest):
    """Generate study flashcards grounded in uploaded document chunks."""
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    if not _documents:
        raise HTTPException(status_code=400, detail="No documents uploaded yet. Please upload a PDF first.")

    doc_info = None
    if req.doc_id:
        doc_info = next((d for d in _documents if d["id"] == req.doc_id), None)
        if not doc_info:
            raise HTTPException(status_code=404, detail="Selected document not found.")

    chunks = embeddings.get_document_chunks(req.doc_id)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No text chunks found for the selected document. Ensure the PDF contains readable text.",
        )

    try:
        card_data = generate_flashcards(
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
