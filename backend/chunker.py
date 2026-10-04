"""
LearnSphere RAG Backend — Text chunking with overlapping windows.
"""

from config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_pages(
    pages: list[dict],
    filename: str,
    doc_id: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[dict]:
    """
    Split extracted page texts into overlapping chunks while preserving metadata.

    Each page's text is split into chunks of `chunk_size` characters with
    `chunk_overlap` characters of overlap between consecutive chunks.

    Returns a list of chunk dicts, each containing:
      - chunk_id: unique identifier "{doc_id}_p{page}_c{idx}"
      - doc_id: the document identifier
      - filename: original PDF filename
      - page_number: which page the chunk came from (1-indexed)
      - text: the chunk text content
    """
    chunks: list[dict] = []

    for page in pages:
        page_num = page["page_number"]
        text = page["text"]

        if not text:
            continue

        start = 0
        chunk_idx = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "chunk_id": f"{doc_id}_p{page_num}_c{chunk_idx}",
                    "doc_id": doc_id,
                    "filename": filename,
                    "page_number": page_num,
                    "text": chunk_text,
                })
                chunk_idx += 1

            # Advance by (chunk_size - chunk_overlap) to create overlap
            start += chunk_size - chunk_overlap

    return chunks
