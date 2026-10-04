"""
LearnSphere RAG Backend — PDF text extraction using PyMuPDF.
"""

import fitz  # PyMuPDF
from pathlib import Path


def extract_text_from_pdf(pdf_path: str | Path) -> list[dict]:
    """
    Extract text from a PDF file page by page.

    Returns a list of dicts, each containing:
      - page_number (1-indexed)
      - text (the raw text content of that page)
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    pages: list[dict] = []
    doc = fitz.open(str(pdf_path))
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            pages.append({
                "page_number": page_num + 1,  # 1-indexed
                "text": text.strip(),
            })
    finally:
        doc.close()

    return pages
