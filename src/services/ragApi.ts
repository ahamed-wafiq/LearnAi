/**
 * LearnSphere RAG API Client
 * 
 * Connects the React frontend to the FastAPI RAG backend.
 * All calls go through http://localhost:8000/api
 */

const API_BASE = 'http://localhost:8000/api';

// ── Types ─────────────────────────────────────────────────────────────

export interface RAGDocument {
  id: string;
  filename: string;
  file_size_mb: number;
  total_pages: number;
  non_empty_pages: number;
  chunks_count: number;
  upload_time: string;
  status: string;
}

export interface RAGCitation {
  filename: string;
  page_number: number;
  excerpt: string;
}

export interface RAGAskResponse {
  answer: string;
  citations: RAGCitation[];
  key_takeaways: string[];
  follow_up_questions: string[];
}

export interface RAGUploadResult {
  message: string;
  document: RAGDocument;
  processing: {
    pages_extracted: number;
    chunks_created: number;
    vectors_added: number;
    embedding_time_sec: number;
  };
}

export interface RAGHealthResponse {
  status: string;
  documents_count: number;
  index: {
    total_vectors: number;
    total_chunks: number;
    total_documents: number;
  };
  gemini_configured: boolean;
}

// ── API calls ─────────────────────────────────────────────────────────

/** Check backend health and index stats */
export async function checkHealth(): Promise<RAGHealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend is not reachable');
  return res.json();
}

/** Upload a PDF file to the RAG backend */
export async function uploadPDF(
  file: File,
  onProgress?: (pct: number) => void
): Promise<RAGUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errDetail = 'Upload failed';
          try {
            const errBody = JSON.parse(xhr.responseText);
            errDetail = errBody.detail || errBody.message || errDetail;
          } catch {
            errDetail = xhr.statusText || errDetail;
          }
          reject(new Error(errDetail));
        }
      } catch (err: any) {
        reject(new Error(`Failed to parse upload response: ${err.message}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Is backend running at http://localhost:8000?'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

/** List all indexed documents */
export async function listDocuments(): Promise<RAGDocument[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    let msg = 'Failed to fetch documents';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  return data.documents;
}

/** Delete a document from the index */
export async function deleteDocument(docId: string): Promise<{ message: string; chunks_removed: number }> {
  const res = await fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' });
  if (!res.ok) {
    let msg = 'Delete failed';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** Ask a question using RAG */
export async function askQuestion(
  question: string,
  docId?: string
): Promise<RAGAskResponse> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, doc_id: docId || null }),
  });

  if (!res.ok) {
    let msg = 'Failed to get answer';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      msg = `Server returned ${res.status}: ${res.statusText}`;
    }
    throw new Error(msg);
  }

  return res.json();
}

/** Get the URL for rendering a specific PDF page as an image */
export function getDocumentPageImageUrl(docId: string, pageNumber: number, dpi: number = 150): string {
  return `${API_BASE}/documents/${encodeURIComponent(docId)}/page/${pageNumber}?dpi=${dpi}`;
}

/** Fetch extracted text for a specific PDF page */
export async function getDocumentPageText(
  docId: string,
  pageNumber: number
): Promise<{ page_number: number; text: string }> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(docId)}/page/${pageNumber}/text`);
  if (!res.ok) {
    throw new Error(`Failed to load page ${pageNumber} text`);
  }
  return res.json();
}

/** Get URL to open or download the original PDF */
export function getDocumentPdfUrl(docId: string): string {
  return `${API_BASE}/documents/${encodeURIComponent(docId)}/pdf`;
}

