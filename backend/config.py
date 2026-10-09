"""
Learn AI RAG Backend — Configuration and constants.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directories (all relative to backend/)
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
INDEX_DIR = DATA_DIR / "index"

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Ensure directories exist at import time
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

# Database configuration
raw_db_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:123456@127.0.0.1:3000/learnai"
)
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)

DATABASE_URL = raw_db_url

# Chunking parameters
CHUNK_SIZE = 500       # characters per chunk
CHUNK_OVERLAP = 100    # overlapping characters between consecutive chunks

# Embedding model
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# FAISS index filenames
FAISS_INDEX_FILE = INDEX_DIR / "faiss.index"
CHUNKS_META_FILE = INDEX_DIR / "chunks_meta.json"

# RAG retrieval
TOP_K = 5

# Gemini
GEMINI_MODEL = "gemini-3.8-flash"
