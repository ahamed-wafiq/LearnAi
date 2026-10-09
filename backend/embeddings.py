"""
Learn AI RAG Backend — Embedding generation and FAISS vector store.

Handles:
  - Generating embeddings via Google Gemini Embedding API (models/gemini-embedding-001)
  - Zero local RAM overhead (eliminates heavy PyTorch/CUDA bloat for cloud & Render free-tier)
  - Building, updating, searching, and persisting the FAISS index
  - Maintaining authoritative FAISS ID mapping back to document chunks
"""

import os
import json
import numpy as np
import faiss
from pathlib import Path
from dotenv import load_dotenv
from google import genai

from config import (
    EMBEDDING_MODEL_NAME,
    FAISS_INDEX_FILE,
    CHUNKS_META_FILE,
    TOP_K,
)

# Load environment
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ── Module-level singletons ────────────────────────────────────────────

_index: faiss.IndexFlatIP | None = None  # Inner-product (cosine after normalisation)
_chunks_meta: list[dict] = []            # Parallel list of chunk metadata
EMBEDDING_DIM = 3072                     # Gemini embedding dimension (or 768 fallback)


def _get_genai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend/.env")
    return genai.Client(api_key=api_key)


def _embed_texts(texts: list[str]) -> np.ndarray:
    """Generate normalized vector embeddings using Google Gemini API."""
    if not texts:
        return np.empty((0, EMBEDDING_DIM), dtype=np.float32)

    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        try:
            client = _get_genai_client()
            all_vecs = []
            batch_size = 50
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                res = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=batch,
                )
                for emb in res.embeddings:
                    vec = np.array(emb.values, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    all_vecs.append(vec)
            if all_vecs:
                return np.array(all_vecs, dtype=np.float32)
        except Exception as e:
            print(f"[embeddings] Gemini embedding API warning: {e}, using fallback vectorizer")

    # Lightweight fallback vectorizer if offline
    dim = EMBEDDING_DIM
    vecs = []
    for text in texts:
        vec = np.zeros(dim, dtype=np.float32)
        for word in text.lower().split():
            idx = hash(word) % dim
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        vecs.append(vec)
    return np.array(vecs, dtype=np.float32)


# ── Persistence ─────────────────────────────────────────────────────────

def _save_index() -> None:
    """Persist the FAISS index and chunk metadata to disk."""
    if _index is not None and _index.ntotal > 0:
        faiss.write_index(_index, str(FAISS_INDEX_FILE))
    elif FAISS_INDEX_FILE.exists():
        FAISS_INDEX_FILE.unlink(missing_ok=True)
    with open(CHUNKS_META_FILE, "w", encoding="utf-8") as f:
        json.dump(_chunks_meta, f, ensure_ascii=False)


def _load_index() -> None:
    """Load existing FAISS index and metadata from disk if available."""
    global _index, _chunks_meta

    if FAISS_INDEX_FILE.exists() and CHUNKS_META_FILE.exists():
        try:
            _index = faiss.read_index(str(FAISS_INDEX_FILE))
            with open(CHUNKS_META_FILE, "r", encoding="utf-8") as f:
                _chunks_meta = json.load(f)
            # Ensure all existing chunks have faiss_index_id assigned
            for i, chunk in enumerate(_chunks_meta):
                if "faiss_index_id" not in chunk:
                    chunk["faiss_index_id"] = i
            print(f"[embeddings] Loaded index with {_index.ntotal} vectors and {len(_chunks_meta)} chunks.")
            return
        except Exception as e:
            print(f"[embeddings] Warning loading FAISS index: {e}, initializing fresh index.")

    _index = faiss.IndexFlatIP(EMBEDDING_DIM)
    _chunks_meta = []
    print("[embeddings] Created fresh FAISS index.")


def ensure_index_loaded() -> None:
    """Public helper: make sure the index is in memory."""
    global _index
    if _index is None:
        _load_index()


# ── Core operations ─────────────────────────────────────────────────────

def add_chunks(chunks: list[dict]) -> tuple[int, list[int]]:
    """
    Embed a list of chunk dicts and add them to the FAISS index.

    Each dict must have a 'text' key.
    Attaches 'faiss_index_id' to each chunk dict.
    Returns (num_added, list_of_faiss_ids).
    """
    ensure_index_loaded()

    if not chunks:
        return 0, []

    texts = [c["text"] for c in chunks]
    embeddings = _embed_texts(texts)

    # Initialize index with dynamic embedding dimension if needed
    global _index
    if _index is None or (_index.ntotal == 0 and embeddings.shape[1] != _index.d):
        _index = faiss.IndexFlatIP(embeddings.shape[1])

    start_id = _index.ntotal
    faiss_ids = []
    for i, c in enumerate(chunks):
        fid = start_id + i
        c["faiss_index_id"] = fid
        faiss_ids.append(fid)

    _index.add(embeddings)
    _chunks_meta.extend(chunks)
    _save_index()

    return len(texts), faiss_ids


def search(query: str, top_k: int = TOP_K) -> list[dict]:
    """
    Retrieve the top-k most relevant chunks for a query string.

    Returns a list of chunk metadata dicts, each augmented with a 'score' key.
    """
    ensure_index_loaded()

    if _index is None or _index.ntotal == 0:
        return []

    query_vec = _embed_texts([query])
    if query_vec.shape[1] != _index.d:
        # Dimension mismatch protection
        query_vec = np.resize(query_vec, (1, _index.d))

    distances, indices = _index.search(query_vec, min(top_k, _index.ntotal))

    results: list[dict] = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1 or idx >= len(_chunks_meta):
            continue
        chunk = {**_chunks_meta[idx], "score": float(dist), "faiss_index_id": idx}
        results.append(chunk)

    return results


def remove_document(doc_id: str) -> tuple[int, list[dict]]:
    """
    Remove all chunks belonging to a document from the index.

    Rebuilds the index from the remaining chunks and reassigns sequential faiss_index_ids.
    Returns (removed_count, remaining_chunks).
    """
    global _index, _chunks_meta
    ensure_index_loaded()

    remaining = [c for c in _chunks_meta if c.get("doc_id") != doc_id]
    removed_count = len(_chunks_meta) - len(remaining)

    if removed_count == 0:
        return 0, _chunks_meta

    # Rebuild
    _index = faiss.IndexFlatIP(EMBEDDING_DIM)
    _chunks_meta = remaining

    # Reassign sequential FAISS IDs
    for i, chunk in enumerate(_chunks_meta):
        chunk["faiss_index_id"] = i

    if remaining:
        texts = [c["text"] for c in remaining]
        embeddings = _embed_texts(texts)
        if embeddings.shape[1] != _index.d:
            _index = faiss.IndexFlatIP(embeddings.shape[1])
        _index.add(embeddings)

    _save_index()
    return removed_count, _chunks_meta


def get_index_stats() -> dict:
    """Return basic stats about the current index."""
    ensure_index_loaded()
    total = _index.ntotal if _index else 0
    doc_ids = set(c.get("doc_id") for c in _chunks_meta if c.get("doc_id"))
    return {
        "total_vectors": total,
        "total_chunks": len(_chunks_meta),
        "total_documents": len(doc_ids),
    }


def get_document_chunks(doc_id: str | None = None) -> list[dict]:
    """Return all chunks belonging to a document, or all indexed chunks if doc_id is None."""
    ensure_index_loaded()
    if doc_id:
        return [c for c in _chunks_meta if c.get("doc_id") == doc_id]
    return list(_chunks_meta)
