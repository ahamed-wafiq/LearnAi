"""
LearnSphere RAG Backend — Embedding generation and FAISS vector store.

Handles:
  - Loading / lazy-initialising the sentence-transformers model
  - Generating embeddings for text chunks
  - Building, updating, searching, and persisting the FAISS index
  - Persisting chunk metadata alongside the index
"""

import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path

from config import (
    EMBEDDING_MODEL_NAME,
    FAISS_INDEX_FILE,
    CHUNKS_META_FILE,
    TOP_K,
)

# ── Module-level singletons ────────────────────────────────────────────

_model: SentenceTransformer | None = None
_index: faiss.IndexFlatIP | None = None  # Inner-product (cosine after normalisation)
_chunks_meta: list[dict] = []            # Parallel list of chunk metadata


def _get_model() -> SentenceTransformer:
    """Lazy-load the embedding model once."""
    global _model
    if _model is None:
        print(f"[embeddings] Loading model: {EMBEDDING_MODEL_NAME} ...")
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print("[embeddings] Model loaded.")
    return _model


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
        _index = faiss.read_index(str(FAISS_INDEX_FILE))
        with open(CHUNKS_META_FILE, "r", encoding="utf-8") as f:
            _chunks_meta = json.load(f)
        print(f"[embeddings] Loaded index with {_index.ntotal} vectors and {len(_chunks_meta)} chunks.")
    else:
        # all-MiniLM-L6-v2 produces 384-dimensional embeddings
        _index = faiss.IndexFlatIP(384)
        _chunks_meta = []
        print("[embeddings] Created fresh FAISS index.")


def ensure_index_loaded() -> None:
    """Public helper: make sure the index is in memory."""
    global _index
    if _index is None:
        _load_index()


# ── Core operations ─────────────────────────────────────────────────────

def add_chunks(chunks: list[dict]) -> int:
    """
    Embed a list of chunk dicts and add them to the FAISS index.

    Each dict must have a 'text' key.  The full dict is stored in _chunks_meta.
    Returns the number of vectors added.
    """
    ensure_index_loaded()

    model = _get_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype=np.float32)

    _index.add(embeddings)           # type: ignore[union-attr]
    _chunks_meta.extend(chunks)
    _save_index()

    return len(texts)


def search(query: str, top_k: int = TOP_K) -> list[dict]:
    """
    Retrieve the top-k most relevant chunks for a query string.

    Returns a list of chunk metadata dicts, each augmented with a 'score' key.
    """
    ensure_index_loaded()

    if _index is None or _index.ntotal == 0:
        return []

    model = _get_model()
    query_vec = model.encode([query], normalize_embeddings=True)
    query_vec = np.array(query_vec, dtype=np.float32)

    distances, indices = _index.search(query_vec, min(top_k, _index.ntotal))

    results: list[dict] = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        chunk = {**_chunks_meta[idx], "score": float(dist)}
        results.append(chunk)

    return results


def remove_document(doc_id: str) -> int:
    """
    Remove all chunks belonging to a document from the index.

    Because FAISS IndexFlatIP doesn't support selective deletion we rebuild
    the index from the remaining chunks.  Returns the number of chunks removed.
    """
    global _index, _chunks_meta
    ensure_index_loaded()

    remaining = [c for c in _chunks_meta if c["doc_id"] != doc_id]
    removed_count = len(_chunks_meta) - len(remaining)

    if removed_count == 0:
        return 0

    # Rebuild
    model = _get_model()
    dim = model.get_sentence_embedding_dimension()
    _index = faiss.IndexFlatIP(dim)
    _chunks_meta = remaining

    if remaining:
        texts = [c["text"] for c in remaining]
        embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        embeddings = np.array(embeddings, dtype=np.float32)
        _index.add(embeddings)

    _save_index()
    return removed_count


def get_index_stats() -> dict:
    """Return basic stats about the current index."""
    ensure_index_loaded()
    total = _index.ntotal if _index else 0
    doc_ids = set(c["doc_id"] for c in _chunks_meta)
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

