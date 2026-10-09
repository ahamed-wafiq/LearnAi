# Learn AI — AI-Powered Study Operating System

<p align="center">
  <img src="https://img.shields.io/badge/Learn_AI-Study_OS-6366F1?style=for-the-badge&logo=openai&logoColor=white" alt="Learn AI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/FAISS-Vector_Store-00599C?style=for-the-badge" alt="FAISS" />
  <img src="https://img.shields.io/badge/Gemini_API-3.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Blender_3D-Hero_Scene-F5792A?style=for-the-badge&logo=blender&logoColor=white" alt="Blender" />
</p>

**Learn AI** is a next-generation, student-centric **AI Study Operating System** featuring an end-to-end local **Retrieval-Augmented Generation (RAG)** pipeline, persistent **PostgreSQL** storage, interactive 3D hero experiences, and intelligent learning analytics.

Upload textbooks, lecture slides, syllabus PDFs, and research papers — Learn AI extracts, chunks, and indexes your materials locally, allowing you to study with zero-hallucination grounded responses, precise page-level citations, AI-generated active recall quizzes, spaced-repetition flashcards, and adaptive revision calendars.

---

## 🌟 Key Capabilities & Modules

### 📚 Knowledge Library & Document Ingestion
- **Multi-Page PDF Ingestion**: Drag-and-drop document upload with real-time progress indicators.
- **Automated Text Extraction & Chunking**: Overlapping character chunking preserving document filename, chunk ID, and exact page numbers.
- **PostgreSQL Persistence**: Dual-layer persistence storing metadata, chunks, and citations across relational tables and local file backups.
- **Original PDF Streaming**: Render original PDFs directly in-browser or download via `/api/documents/{id}/pdf`.

### 🧠 AI Study Room & Split-Screen Reader
- **High-Fidelity Visual PDF Viewer**: Real-time server-side page rasterization to PNG powered by PyMuPDF (`fitz`), with zoom controls (70%–160%), page navigation, and jump-to-page.
- **Interactive Citation Anchors**: Click any citation card in the chat to jump the document viewer to that exact page, displaying a floating reference banner with quote verification and similarity percentage.
- **Dual Viewer Modes**: Seamlessly toggle between visual page rendering and extracted raw text with one-click copy.
- **Document Scoping**: Switch between querying the *Current PDF* or searching across *All PDFs* in your library.

### ⚡ Grounded AI Copilot (RAG Pipeline)
- **Zero Hallucination Guardrails**: Prompts restrict answers strictly to retrieved context chunks from your uploaded materials.
- **STEM Formula & LaTeX Support**: Sanitized parsing handles complex STEM equations, math formulas, and code blocks cleanly.
- **Takeaways & Follow-Up Prompts**: Automatically extracts key bullet points and generates follow-up questions for deeper comprehension.

### 🎯 Active Recall & Practice Arena
- **Grounded Quiz Generation**: Automatically generates multi-question active recall quizzes (Multiple Choice, True/False, Short Answer) grounded in your documents.
- **Spaced Repetition Flashcards**: Automatically extracts core flashcard decks from document chunks with mastery tracking (Review Needed / Mastered).
- **Learning Analytics Engine**: Computes topic mastery scores, identifies learning bottlenecks, and tracks study trends over time.

### 📅 Adaptive Study Planner
- **Goal-Driven Timelines**: Set study deadlines, exam targets, and target mastery levels.
- **Automated 7-Day Study Schedules**: Generates dynamic daily checklists and scheduled revision tasks that adapt based on quiz performance.

### 🎨 Retro-Futuristic & 3D Hero UI
- **Blender 3D Hero Scene**: Custom-crafted 3D floating study sphere, isometric desk setup, holographic computer, and ambient glow rendered and exported to interactive WebGL/glTF and lightweight fallback imagery.
- **Cyber-Academia Aesthetic**: Glassmorphic panels, glowing neon accents, retro starfields, scanlines, and fluid micro-animations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Learn AI React Frontend (Vite + TS)                │
│                            http://localhost:5173                        │
│                                                                         │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────┐   │
│   │  Knowledge Library  │   │    AI Study Room    │   │ 3D Hero &   │   │
│   │  (PDF Upload & Hub) │   │ (Split-Screen RAG)  │   │ Practice OS │   │
│   └──────────┬──────────┘   └──────────┬──────────┘   └──────┬──────┘   │
└──────────────┼─────────────────────────┼─────────────────────┼──────────┘
               │ HTTP REST               │                     │
               ▼                         ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Learn AI FastAPI Python Backend                     │
│                            http://localhost:8000                        │
│                                                                         │
│   ┌───────────────────────┐   ┌─────────────────────────────────────┐   │
│   │   PyMuPDF (fitz)      │   │        SentenceTransformers         │   │
│   │ Text & Page Rendering │   │        (all-MiniLM-L6-v2)           │   │
│   └──────────┬────────────┘   └──────────────────┬──────────────────┘   │
│              ▼                                   ▼                      │
│   ┌───────────────────────┐   ┌─────────────────────────────────────┐   │
│   │ Chunker (500/100 ovl) │   │          FAISS Vector Store         │   │
│   │  Page-level metadata  │   │         (IndexFlatIP Cosine)        │   │
│   └──────────┬────────────┘   └──────────────────┬──────────────────┘   │
│              │                                   │                      │
│              └─────────────────┬─────────────────┘                      │
│                                ▼                                        │
│                 ┌─────────────────────────────┐                         │
│                 │   Gemini 3.5 Flash Copilot  │                         │
│                 │  Grounded Synthesis & Cites │                         │
│                 └──────────────┬──────────────┘                         │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Relational Storage Layer                     │
│      (Users · Documents · Chunks · Q&A History · Quizzes · Plans)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion, Canvas Confetti, Recharts |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.x, Alembic, Pydantic v2 |
| **Database** | PostgreSQL 16+ (with resilient JSON fallback layer) |
| **PDF Engine** | PyMuPDF (`fitz`) — document parsing & server-side PNG page rasterization |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional embeddings) |
| **Vector Search** | FAISS (`IndexFlatIP` with normalized vectors for exact cosine similarity) |
| **LLM Inference** | Google Gemini API (`gemini-3.5-flash` with structured output schemas) |
| **3D Assets** | Blender 3D, glTF / GLB, WebP visual rasterization |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **PostgreSQL** ≥ 15 (Optional, SQLite/JSON fallback available)
- **Google Gemini API Key** — [Get a free API key here](https://aistudio.google.com/apikey)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/ahamed-wafiq/LearnAi.git
cd LearnAi
```

---

### Step 2: Set Up the Backend

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and configure your keys:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     DATABASE_URL=postgresql+psycopg://postgres:password@127.0.0.1:5432/learnai
     ```

5. (Optional) Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the FastAPI backend:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The backend starts at **http://localhost:8000**.*

---

### Step 3: Set Up the Frontend

1. In the project root (`LearnAi/`):
   ```bash
   npm install
   ```

2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend starts at **http://localhost:5173**.*

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Comprehensive health check (FastAPI, PostgreSQL, FAISS, Embeddings, Gemini) |
| `POST` | `/api/upload` | Upload a PDF; parses text, chunks, embeds, indexes, and persists to DB |
| `GET` | `/api/documents` | List all uploaded documents with chunk count, page count, and status |
| `DELETE` | `/api/documents/{id}` | Delete a document, remove source file, and purge vectors from index |
| `GET` | `/api/documents/{id}/page/{page}` | Render a specific PDF page as PNG (`image/png`) |
| `GET` | `/api/documents/{id}/page/{page}/text` | Get raw extracted text for a specific page |
| `GET` | `/api/documents/{id}/pdf` | Stream or download the original uploaded PDF file |
| `POST` | `/api/ask` | Query documents via local RAG (FAISS retrieval + Gemini synthesis) |
| `POST` | `/api/practice/generate` | Generate active recall quizzes from document chunks |
| `POST` | `/api/practice/save` | Save quiz attempt scores and answers |
| `POST` | `/api/flashcards/generate` | Generate flashcard decks grounded in uploaded materials |
| `GET` | `/api/analytics` | Retrieve learning analytics, topic mastery, and weakness predictions |
| `GET` | `/api/planner/overview` | Retrieve personalized study planner overview and task schedule |

---

## 📁 Project Structure

```
LearnAi/
├── assets/
│   └── blender/               # Blender 3D scene source files (.blend)
├── backend/
│   ├── main.py                # FastAPI application & REST endpoints
│   ├── config.py              # Configuration constants & path management
│   ├── database.py            # SQLAlchemy 2.x session & connection management
│   ├── db_sync.py             # Database bidirectional synchronization
│   ├── pdf_parser.py          # PyMuPDF text & page extraction
│   ├── chunker.py             # Overlapping text chunker with page tracking
│   ├── embeddings.py          # SentenceTransformers & FAISS vector store
│   ├── rag_engine.py          # Gemini answer & quiz generation engine
│   ├── analytics_engine.py    # Topic mastery & spaced repetition engine
│   ├── planner_engine.py      # Adaptive study planner & calendar engine
│   ├── models/                # SQLAlchemy database models (User, Document, QA, Quiz)
│   ├── schemas/               # Pydantic v2 validation schemas
│   ├── migrations/            # Alembic database migration scripts
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
├── public/
│   ├── hero/                  # Rendered 3D hero imagery (WebP/PNG)
│   └── models/                # 3D glTF/GLB models for WebGL hero scene
├── src/
│   ├── components/            # UI components (Retro, Layout, Cards, Buttons)
│   ├── pages/
│   │   ├── HomePage.tsx       # Landing page with 3D Hero & interactive showcase
│   │   ├── LibraryPage.tsx    # PDF upload, document library, and status tracking
│   │   ├── AIStudyRoomPage.tsx# Split-screen PDF viewer & citation chat
│   │   ├── PracticePage.tsx   # AI quizzes & active recall arena
│   │   ├── FlashcardsPage.tsx # Spaced repetition flashcard decks
│   │   ├── AnalyticsPage.tsx  # Topic mastery, accuracy trends & ML diagnostics
│   │   └── StudyPlannerPage.tsx # 7-day adaptive study planner & calendar
│   ├── services/
│   │   ├── ragApi.ts          # Backend API client
│   │   └── studyService.ts    # Frontend study state & mock fallbacks
│   ├── App.tsx                # React Router navigation
│   └── index.css              # Custom styling & retro cyber design system
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite configuration
└── README.md                  # Project documentation
```

---

## 🛡️ License

This project is open-source and licensed under the [MIT License](LICENSE).
