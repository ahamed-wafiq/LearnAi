"""
Database Synchronization & Migration Utilities.
Safely imports existing JSON document and chunk metadata into PostgreSQL on startup.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from config import DATA_DIR, CHUNKS_META_FILE
from database import SessionLocal, get_or_create_dev_user
from models.document import Document, DocumentChunk, DocumentStatus


def sync_legacy_json_to_db(db: Session) -> int:
    """
    Check if legacy documents.json or chunks_meta.json have documents
    that are not yet in PostgreSQL, and safely import them.
    Preserves all existing IDs, chunks, and FAISS mappings.
    """
    dev_user = get_or_create_dev_user(db)
    docs_file = DATA_DIR / "documents.json"
    chunks_file = CHUNKS_META_FILE

    if not docs_file.exists():
        return 0

    try:
        with open(docs_file, "r", encoding="utf-8") as f:
            legacy_docs = json.load(f)
    except Exception as e:
        print(f"[db_sync] Warning reading legacy documents.json: {e}")
        return 0

    legacy_chunks = []
    if chunks_file.exists():
        try:
            with open(chunks_file, "r", encoding="utf-8") as f:
                legacy_chunks = json.load(f)
        except Exception as e:
            print(f"[db_sync] Warning reading legacy chunks_meta.json: {e}")

    imported_count = 0
    for doc_dict in legacy_docs:
        doc_id = doc_dict.get("id")
        if not doc_id:
            continue

        existing_doc = db.query(Document).filter(Document.id == doc_id).first()
        if existing_doc:
            continue

        # Parse upload time or fallback to now
        created_at = datetime.now(timezone.utc)
        upload_time_str = doc_dict.get("upload_time")
        if upload_time_str:
            try:
                created_at = datetime.strptime(upload_time_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                pass

        file_size_bytes = int(doc_dict.get("file_size_mb", 0) * 1024 * 1024)
        if file_size_bytes == 0 and doc_dict.get("file_path"):
            p = Path(doc_dict["file_path"])
            if p.exists():
                file_size_bytes = p.stat().st_size

        new_doc = Document(
            id=doc_id,
            user_id=dev_user.id,
            filename=doc_dict.get("filename", "document.pdf"),
            original_filename=doc_dict.get("filename", "document.pdf"),
            file_path=doc_dict.get("file_path", ""),
            file_size=file_size_bytes,
            page_count=doc_dict.get("total_pages", 0),
            chunk_count=doc_dict.get("chunks_count", 0),
            status=DocumentStatus.READY.value,
            created_at=created_at,
            updated_at=created_at,
            indexed_at=created_at,
        )
        db.add(new_doc)
        db.flush()

        # Add corresponding chunks
        matching_chunks = [c for c in legacy_chunks if c.get("doc_id") == doc_id]
        for idx, c in enumerate(matching_chunks):
            chunk_record = DocumentChunk(
                document_id=doc_id,
                chunk_id=c.get("chunk_id", f"{doc_id}_chunk_{idx}"),
                page_number=c.get("page_number", 1),
                text=c.get("text", ""),
                start_offset=c.get("start_offset", 0),
                end_offset=c.get("end_offset", len(c.get("text", ""))),
                faiss_index_id=c.get("faiss_index_id", idx),
            )
            db.add(chunk_record)

        imported_count += 1

    if imported_count > 0:
        db.commit()
        print(f"[db_sync] Successfully imported {imported_count} legacy document(s) into PostgreSQL.")

    return imported_count
