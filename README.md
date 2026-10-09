# Learn AI — AI-Powered Study OS with Local RAG

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/FAISS-Vector_Store-00599C" alt="FAISS" />
  <img src="https://img.shields.io/badge/PyMuPDF-PDF_Engine-FF0000" alt="PyMuPDF" />
  <img src="https://img.shields.io/badge/Gemini_API-3.5_Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
</p>

Learn AI is a modern, student-centric **AI Study Operating System** featuring a local **Retrieval-Augmented Generation (RAG)** pipeline. Upload textbooks, lecture slides, and research papers — Learn AI extracts, chunks, and indexes your documents locally, allowing you to ask questions with answers grounded directly in your study materials and supported by **page-level citations**.

---

## 🌟 Key Features

### 📚 Knowledge Library & Source Hub
- **Drag-and-Drop Ingestion**: Upload multi-page PDFs with real-time progress indicators.
- **Automated Text Extraction & Chunking**: Overlapping character chunking preserving document filename, chunk ID, and exact page numbers.
- **Document Management**: View total pages, chunk counts, upload timestamps, indexed status badges, and delete indexed documents with immediate vector index cleanup.
- **Original PDF Streaming**: Open original PDFs directly in a new browser tab or download them via `/api/documents/{id}/pdf`.

### 🧠 AI Study Room & Split-Screen Reader
- **High-Fidelity Visual PDF Viewer**: Real-time server-side page rendering to PNG powered by PyMuPDF (`fitz`), supporting zoom controls (70%–160%), page navigation (`<`, `>`, jump to page), and clean responsive sizing.
- **Dual Viewer Modes**:
  - **Visual Page**: Renders the exact visual page layout, formulas, and diagrams.
  - **Text Mode**: Inspect the raw extracted text of the current page with a one-click copy tool.
- **Interactive Citation Anchors**: Click any citation card in the chat to automatically jump the document viewer to that exact page, displaying a floating reference banner with quote verification and match percentage.
- **Document Scoping**: Switch seamlessly between querying the *Current PDF* or searching across *All PDFs* in your library.

### ⚡ Grounded AI Copilot (RAG Pipeline)
- **Zero Hallucination Guardrails**: Prompts restrict answers strictly to retrieved context chunks from your uploaded materials.
- **LaTeX & Formula Handling**: Sanitized parsing handles complex STEM equations (gradient descent, activation functions, loss functions) without JSON decode errors.
- **Key Takeaways & Follow-Up Drills**: Automatically extracts bulleted summary takeaways and clickable follow-up study prompts.
- **Quick Action Chips**: Pre-configured prompts for instant summaries, formula explanations, and 3-question active recall quizzes.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React Frontend (Vite + TS)                  │
│                     http://localhost:5173                   │
│                                                             │
│   ┌───────────────────────┐       ┌─────────────────────┐   │
│   │   Knowledge Library   │       │    AI Study Room    │   │
│   │   (PDF Upload & Hub)  │       │ (Split Screen View) │   │
│   └───────────┬───────────┘       └──────────┬──────────┘   │
└───────────────┼──────────────────────────────┼──────────────┘
                │ HTTP REST                    │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Python FastAPI RAG Backend                  │
│                     http://localhost:8000                   │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   PyMuPDF (fitz)      │       │ SentenceTransformers  │  │
│  │ Text & Page Rendering │       │  (all-MiniLM-L6-v2)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Chunker (500/100 ovl) │       │   FAISS Vector Index  │  │
│  │   Page-level metadata │       │   (IndexFlatIP Cosine)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              └───────────────┬───────────────┘              │
│                              ▼                              │
│                ┌───────────────────────────┐                │
│                │     Gemini 3.5 Flash      │                │
│                │ Grounded Synthesis & Cite │                │
│                └───────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, Pydantic, python-multipart |
| **PDF Engine** | PyMuPDF (`fitz`) — text parsing & server-side PNG page rasterization |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional vectors) |
| **Vector Search** | FAISS (`IndexFlatIP` with normalized vectors for cosine similarity) |
| **LLM Inference** | Google Gemini API (`gemini-3.5-flash` with structured JSON output) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Google Gemini API Key** — [Get a free key here](https://aistudio.google.com/apikey)

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

4. Configure your Gemini API key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and add your key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

5. Start the FastAPI backend:
   ```bash
   python main.py
   ```
   *The backend starts at **http://localhost:8000**. On first startup, it will download the 90 MB embedding model.*

---

### Step 3: Set Up the Frontend

1. Open a new terminal in the project root:
   ```bash
   cd LearnAi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend starts at **http://localhost:5173**.*

---

## 📖 How to Use

1. **Upload Documents**:
   - Go to **My Library** (`/library`) and click **Upload PDF** or drag and drop a PDF file into the dropzone.
   - The backend parses the PDF page by page, creates overlapping text chunks, computes sentence embeddings, and indexes them in FAISS.
2. **Open Study Room**:
   - Click **Open AI Room** on any uploaded document card to enter the split-screen workspace (`/study-room?doc=doc-xxxx`).
3. **Ask Questions**:
   - Type your question in the chat bar on the right (or select a quick prompt chip like *Summarize Doc* or *Core Formulas*).
   - The RAG engine searches FAISS for top-$k$ relevant chunks and Gemini generates a grounded response with citations.
4. **Inspect Source Citations**:
   - Every response lists citations with the PDF filename, page number, confidence percentage, and the cited quote excerpt.
   - Click on any citation card to automatically navigate the left pane to that exact PDF page and view the highlighted quote.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & vector index statistics |
| `POST` | `/api/upload` | Upload a PDF; extracts text, chunks, embeds, and indexes it |
| `GET` | `/api/documents` | List all uploaded and indexed documents with metadata |
| `DELETE` | `/api/documents/{id}` | Delete a document, remove uploaded file, and purge vectors from index |
| `GET` | `/api/documents/{id}/page/{page}` | Render a specific PDF page as a PNG image (`image/png`) |
| `GET` | `/api/documents/{id}/page/{page}/text` | Get raw extracted text for a specific page |
| `GET` | `/api/documents/{id}/pdf` | Stream or download the original uploaded PDF file |
| `POST` | `/api/ask` | Query documents via local RAG (FAISS retrieval + Gemini synthesis) |

---

## 📁 Project Structure

```
LearnAi/
├── backend/
│   ├── main.py               # FastAPI application with all endpoints
│   ├── config.py              # Configuration constants & model settings
│   ├── pdf_parser.py          # PyMuPDF text extractor
│   ├── chunker.py             # Overlapping chunk generator with page tracking
│   ├── embeddings.py          # SentenceTransformers & FAISS vector store
│   ├── rag_engine.py          # Gemini answer generator with citation parser
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment template (API keys)
│   └── data/                  # Auto-generated uploads, metadata & FAISS index
├── src/
│   ├── services/
│   │   ├── ragApi.ts          # Frontend API client for FastAPI backend
│   │   └── studyService.ts    # Study and dashboard mock services
│   ├── pages/
│   │   ├── LibraryPage.tsx    # PDF upload, document library, and status tracking
│   │   ├── AIStudyRoomPage.tsx# Split-screen PDF viewer & citation chat
│   │   ├── DashboardPage.tsx  # Study overview, streaks, and analytics
│   │   └── ...                # Other study pages
│   ├── components/            # UI components (Button, Modal, Badge, Layout)
│   ├── App.tsx                # Main routing & application layout
│   └── index.css              # Design system & styles
├── index.html                 # HTML shell
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite configuration
└── README.md
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
