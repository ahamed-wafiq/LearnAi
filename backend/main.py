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
from rag_engine import generate_answer

# ── Load .env ────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ── Document registry (persisted as JSON) ────────────────────────────────

DOCS_REGISTRY_FILE = DATA_DIR / "documents.json"


def _load_docs_registry() -> list[dict]:
    if DOCS_REGISTRY_FILE.exists():
        with open(DOCS_REGISTRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_docs_registry(docs: list[dict]) -> None:
    with open(DOCS_REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2, ensure_ascii=False)


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


# ── Run with: python main.py ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
