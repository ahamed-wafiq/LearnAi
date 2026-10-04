import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Send,
  ExternalLink,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Zap,
  Quote,
  RefreshCw,
  ListOrdered,
  AlertTriangle,
  WifiOff,
  Upload,
  FileImage,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  askQuestion,
  listDocuments,
  checkHealth,
  getDocumentPageImageUrl,
  getDocumentPageText,
  getDocumentPdfUrl,
  type RAGDocument,
} from '../services/ragApi';

// ── Local types for the chat UI ────────────────────────────────────────

interface ChatCitation {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  confidence: number;
}

interface LocalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: ChatCitation[];
  keyTakeaways?: string[];
  suggestedQuestions?: string[];
}

// ── Component ──────────────────────────────────────────────────────────

export const AIStudyRoomPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docIdParam = searchParams.get('doc') || '';

  const [loading, setLoading] = useState(true);
  const [ragDocs, setRagDocs] = useState<RAGDocument[]>([]);
  const [currentDoc, setCurrentDoc] = useState<RAGDocument | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeCitation, setActiveCitation] = useState<ChatCitation | null>(null);

  // Left pane view mode: 'visual' (PyMuPDF rendered page image) or 'text' (raw extracted text)
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [isPageImageLoading, setIsPageImageLoading] = useState<boolean>(true);
  const [pageImageError, setPageImageError] = useState<boolean>(false);
  const [pageText, setPageText] = useState<string>('');
  const [isPageTextLoading, setIsPageTextLoading] = useState<boolean>(false);

  // Query scope: scope search to current document or entire library
  const [queryScope, setQueryScope] = useState<'current' | 'all'>('current');

  // Chat states
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Backend connectivity
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Check backend health
  const refreshBackendHealth = async () => {
    setIsCheckingBackend(true);
    try {
      await checkHealth();
      setBackendOnline(true);
      const docs = await listDocuments();
      setRagDocs(docs);
      if (!currentDoc && docs.length > 0) {
        setCurrentDoc(docs[0]);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setIsCheckingBackend(false);
    }
  };

  useEffect(() => {
    refreshBackendHealth();
  }, []);

  // Load RAG documents on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await listDocuments();
        setRagDocs(docs);
        if (docs.length > 0) {
          const selected = docs.find((d) => d.id === docIdParam) || docs[0];
          setCurrentDoc(selected);
          setCurrentPage(1);

          // Add welcome message
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I've indexed "${selected.filename}" (${selected.total_pages} pages, ${selected.chunks_count} chunks). Ask me any question — I'll retrieve the most relevant sections and generate answers grounded in your document with page citations.`,
              timestamp: 'Just now',
              suggestedQuestions: [
                'Summarize the core concepts in this document',
                'What are the key formulas or definitions?',
                'Generate 3 active recall questions from this material',
              ],
            },
          ]);
        }
      } catch {
        // Backend might be offline
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [docIdParam]);

  // Fetch page text when page changes or switching to text mode
  useEffect(() => {
    if (!currentDoc) return;
    setIsPageImageLoading(true);
    setPageImageError(false);

    if (viewMode === 'text') {
      setIsPageTextLoading(true);
      getDocumentPageText(currentDoc.id, currentPage)
        .then((res) => setPageText(res.text))
        .catch(() => setPageText('Unable to load text for this page.'))
        .finally(() => setIsPageTextLoading(false));
    }
  }, [currentDoc?.id, currentPage, viewMode]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || isSending) return;

    setError('');
    setLastFailedPrompt(null);

    const userMsg: LocalChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsSending(true);

    try {
      const docScope = queryScope === 'current' ? currentDoc?.id : undefined;
      const response = await askQuestion(text, docScope);

      // Convert citations
      const chatCitations: ChatCitation[] = response.citations.map((c, idx) => {
        const matchedDoc = ragDocs.find((d) => d.filename === c.filename);
        return {
          id: `cit-${Date.now()}-${idx}`,
          documentId: matchedDoc?.id || currentDoc?.id || '',
          documentTitle: c.filename,
          pageNumber: c.page_number,
          excerpt: c.excerpt,
          confidence: Math.max(0.7, 0.98 - idx * 0.04),
        };
      });

      const aiReply: LocalChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: chatCitations,
        keyTakeaways: response.key_takeaways,
        suggestedQuestions: response.follow_up_questions,
      };

      setMessages((prev) => [...prev, aiReply]);

      // Jump to first citation if available
      if (chatCitations.length > 0) {
        handleCitationClick(chatCitations[0]);
      }
    } catch (err: any) {
      setLastFailedPrompt(text);
      setError(
        err.message ||
          'Failed to retrieve answer. Make sure the FastAPI backend is running at http://localhost:8000.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCitationClick = (citation: ChatCitation) => {
    // Switch document if citation is from a different indexed document
    if (citation.documentId && citation.documentId !== currentDoc?.id) {
      const targetDoc = ragDocs.find((d) => d.id === citation.documentId);
      if (targetDoc) setCurrentDoc(targetDoc);
    } else if (citation.documentTitle && citation.documentTitle !== currentDoc?.filename) {
      const targetDoc = ragDocs.find((d) => d.filename === citation.documentTitle);
      if (targetDoc) setCurrentDoc(targetDoc);
    }

    setCurrentPage(citation.pageNumber);
    setActiveCitation(citation);
    setIsPageImageLoading(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-7 h-full rounded-2xl" />
        <Skeleton className="lg:col-span-5 h-full rounded-2xl" />
      </div>
    );
  }

  // ── No documents empty state ──────────────────────────────────────────

  if (ragDocs.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-surface-border text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">No Documents Indexed Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {backendOnline === false
                ? 'The RAG backend is currently offline. Start it in backend/ with: python main.py'
                : 'Upload a study PDF in your library to extract chunks, compute vector embeddings, and start Q&A with Gemini.'}
            </p>
          </div>

          {backendOnline === false && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <WifiOff className="w-4 h-4" />
              <span>Backend unreachable on http://localhost:8000</span>
              <button
                onClick={refreshBackendHealth}
                disabled={isCheckingBackend}
                className="ml-2 underline hover:text-white"
              >
                {isCheckingBackend ? 'Checking...' : 'Retry'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="glow" onClick={() => navigate('/library')}>
              <BookOpen className="w-4 h-4" /> Go to Library & Upload PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = currentDoc?.total_pages || 1;
  const allSessionCitations = messages.flatMap((m) => m.citations || []);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Header & Document Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-surface-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Sparkles className="w-5 h-5 text-accent-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate max-w-xs sm:max-w-sm">
                {currentDoc?.filename || 'Document'}
              </span>
              <Badge variant="primary" size="sm">
                RAG Mode
              </Badge>
              {backendOnline ? (
                <span
                  className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                  title="Backend is operational"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"
                  title="Backend is offline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentDoc?.total_pages || 0} pages • {currentDoc?.chunks_count || 0} vector chunks •{' '}
              {currentDoc?.file_size_mb || 0} MB
            </p>
          </div>
        </div>

        {/* Controls: Document selector & actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-surface-subtle border border-surface-border rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-slate-400 mr-2">Doc:</span>
            <select
              value={currentDoc?.id || ''}
              onChange={(e) => {
                const doc = ragDocs.find((d) => d.id === e.target.value);
                if (doc) {
                  setCurrentDoc(doc);
                  setCurrentPage(1);
                  setActiveCitation(null);
                }
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {ragDocs.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface text-slate-200">
                  {d.filename.length > 30 ? d.filename.slice(0, 30) + '...' : d.filename}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/library')}
            leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          >
            Library
          </Button>

          {currentDoc && (
            <a
              href={getDocumentPdfUrl(currentDoc.id)}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-light border border-surface-border text-slate-300 hover:text-white transition-colors"
              title="Open full PDF in browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-14rem)] min-h-[620px]">
        {/* LEFT PANE: PDF Document Viewer & Citations (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-surface-border flex flex-col overflow-hidden shadow-card-subtle">
          {/* Document Toolbar */}
          <div className="h-12 bg-surface-subtle/90 border-b border-surface-border px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
            {/* Page navigation */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  setIsPageImageLoading(true);
                }}
                className="p-1.5 rounded-lg hover:bg-surface-light text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 font-semibold text-slate-200 px-1">
                <span>Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                      setIsPageImageLoading(true);
                    }
                  }}
                  className="w-10 bg-surface border border-surface-border rounded-lg text-center py-0.5 text-xs font-mono focus:outline-none focus:border-primary-500"
                />
                <span className="text-slate-400">of {totalPages}</span>
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  setIsPageImageLoading(true);
                }}
                className="p-1.5 rounded-lg hover:bg-surface-light text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View mode toggle (Visual Image vs Text) */}
            <div className="flex items-center bg-surface rounded-xl p-0.5 border border-surface-border">
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === 'visual'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Render visual PDF page"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visual Page</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  viewMode === 'text'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View extracted text"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Text Mode</span>
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'visual' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(70, prev - 15))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-light transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="text-[11px] font-mono text-slate-300 px-1 hover:text-primary-300"
                  title="Reset Zoom"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(160, prev + 15))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-light transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Document Content Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080C14] space-y-4 select-text">
            {/* Active Citation Highlight Banner */}
            {activeCitation && activeCitation.pageNumber === currentPage && (
              <div className="p-3.5 rounded-xl bg-primary-950/80 border border-primary-500/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary-500/20 text-accent-cyan mt-0.5">
                    <Quote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap font-bold text-primary-200 text-xs">
                      <span>Referenced Citation • Page {activeCitation.pageNumber}</span>
                      <Badge variant="cyan" size="sm">
                        {(activeCitation.confidence * 100).toFixed(0)}% Match
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({activeCitation.documentTitle})
                      </span>
                    </div>
                    <p className="text-slate-100 italic font-mono text-xs mt-1.5 leading-relaxed bg-black/30 p-2 rounded-lg border border-primary-500/20">
                      "{activeCitation.excerpt}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-surface-light transition-colors"
                  title="Dismiss citation banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Visual Page View */}
            {viewMode === 'visual' && currentDoc && (
              <div className="flex flex-col items-center justify-start min-h-[400px]">
                {isPageImageLoading && (
                  <div className="w-full flex flex-col items-center justify-center p-12 space-y-3">
                    <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
                    <p className="text-xs text-slate-400">
                      Rendering page {currentPage} from {currentDoc.filename}...
                    </p>
                  </div>
                )}

                {pageImageError ? (
                  <div className="p-8 text-center glass-card rounded-2xl border border-surface-border max-w-md my-8 space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">Page Preview Unavailable</h4>
                    <p className="text-xs text-slate-400">
                      Could not render the image preview for page {currentPage}. You can switch to
                      Text Mode or view the original PDF.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={() => setViewMode('text')}>
                        Switch to Text Mode
                      </Button>
                      <a
                        href={getDocumentPdfUrl(currentDoc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-500"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Full PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div
                    className="transition-transform duration-200 origin-top shadow-2xl rounded-lg overflow-hidden border border-surface-border bg-white"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    <img
                      src={getDocumentPageImageUrl(currentDoc.id, currentPage)}
                      alt={`Page ${currentPage} of ${currentDoc.filename}`}
                      className={`max-w-full h-auto object-contain block ${
                        isPageImageLoading ? 'hidden' : 'block'
                      }`}
                      onLoad={() => setIsPageImageLoading(false)}
                      onError={() => {
                        setIsPageImageLoading(false);
                        setPageImageError(true);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Extracted Text Mode */}
            {viewMode === 'text' && (
              <div className="glass-card rounded-2xl border border-surface-border p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Extracted Text — Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(pageText, `page-${currentPage}`)}
                    className="text-xs"
                  >
                    {copiedId === `page-${currentPage}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === `page-${currentPage}` ? 'Copied' : 'Copy Text'}</span>
                  </Button>
                </div>

                {isPageTextLoading ? (
                  <div className="space-y-2 py-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
                    {pageText || 'No text extracted for this page.'}
                  </div>
                )}
              </div>
            )}

            {/* All citations recorded in this study session */}
            {allSessionCitations.length > 0 && (
              <div className="pt-4 border-t border-surface-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary-400" /> Citations in this Session (
                    {allSessionCitations.length})
                  </h4>
                  <span className="text-[10px] text-slate-500">Click any card to jump to page</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allSessionCitations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleCitationClick(c)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        activeCitation?.id === c.id && currentPage === c.pageNumber
                          ? 'bg-primary-500/20 border-primary-500/60 shadow-glow-primary'
                          : 'bg-surface-subtle border-surface-border hover:border-primary-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="truncate max-w-[180px] text-primary-300">
                          {c.documentTitle}
                        </span>
                        <Badge variant="primary" size="sm">
                          P.{c.pageNumber}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 italic line-clamp-2">"{c.excerpt}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: AI Study Copilot Chat with Citations (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-surface-border flex flex-col overflow-hidden shadow-card-subtle">
          {/* AI Header & Scope Switcher */}
          <div className="h-12 bg-surface-subtle/90 border-b border-surface-border px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    backendOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backendOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="text-xs font-bold text-slate-200">LearnSphere AI Tutor</span>
            </div>

            {/* Scope toggle */}
            <div className="flex items-center gap-1 bg-surface px-1.5 py-0.5 rounded-lg border border-surface-border text-[10px]">
              <button
                onClick={() => setQueryScope('current')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  queryScope === 'current'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Search only the currently selected document"
              >
                Current PDF
              </button>
              <button
                onClick={() => setQueryScope('all')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  queryScope === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Search across all indexed documents in your library"
              >
                All PDFs
              </button>
            </div>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="p-2.5 bg-surface-subtle/40 border-b border-surface-border flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => handleSendMessage('Summarize the main concepts and arguments of this document')}
              disabled={isSending}
              className="px-2.5 py-1 rounded-lg bg-surface-light border border-surface-border hover:border-primary-500 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-primary-400" /> Summarize Doc
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'What are the core formulas, equations, or definitions in this text? Explain each clearly.'
                )
              }
              disabled={isSending}
              className="px-2.5 py-1 rounded-lg bg-surface-light border border-surface-border hover:border-primary-500 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <HelpCircle className="w-3 h-3 text-accent-cyan" /> Core Formulas
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'Create 3 active recall quiz questions from this document to test my understanding.'
                )
              }
              disabled={isSending}
              className="px-2.5 py-1 rounded-lg bg-surface-light border border-surface-border hover:border-primary-500 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <ListOrdered className="w-3 h-3 text-amber-400" /> 3-Question Quiz
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {msg.role === 'user' ? 'You' : 'LearnSphere Copilot'}
                  </span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[92%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white shadow-md rounded-br-none'
                      : 'bg-surface-light border border-surface-border text-slate-200 rounded-bl-none shadow-md space-y-3'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-line space-y-2 leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Copy response action */}
                  {msg.role === 'assistant' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-accent-cyan tracking-wider flex items-center gap-1">
                        <Quote className="w-3 h-3" /> Grounded Sources & Citations:
                      </span>
                      <div className="space-y-1.5">
                        {msg.citations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleCitationClick(c)}
                            className="p-2.5 rounded-xl bg-surface/90 border border-primary-500/30 hover:border-primary-500/80 hover:bg-surface cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between text-[11px] font-semibold text-primary-300 group-hover:text-primary-200 mb-1">
                              <span className="truncate max-w-[200px] flex items-center gap-1">
                                <FileText className="w-3 h-3 text-primary-400 shrink-0" />
                                {c.documentTitle}
                              </span>
                              <Badge variant="primary" size="sm">
                                Page {c.pageNumber}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-2 italic font-mono bg-black/20 p-1.5 rounded">
                              "{c.excerpt}"
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                              <span>Click to view PDF page</span>
                              <span className="text-accent-cyan font-mono">
                                {(c.confidence * 100).toFixed(0)}% Match
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Key Takeaways:
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {msg.keyTakeaways.map((k, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                            <span>{k}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Recommended Follow-up Questions:
                      </span>
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          disabled={isSending}
                          className="w-full text-left p-1.5 rounded-lg bg-surface/60 hover:bg-surface text-[11px] text-primary-300 hover:text-white transition-colors border border-transparent hover:border-primary-500/30 truncate block disabled:opacity-50"
                        >
                          → {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* In-Flight Generation Indicator */}
            {isSending && (
              <div className="p-3.5 rounded-2xl bg-surface-light border border-primary-500/30 text-primary-300 text-xs flex items-center gap-3 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-accent-cyan shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Generating grounded answer...</p>
                  <p className="text-[11px] text-slate-400">
                    Retrieving nearest vectors from FAISS & prompt-engineering Gemini
                  </p>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Query Failed</p>
                    <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
                {lastFailedPrompt && (
                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleSendMessage(lastFailedPrompt)}
                      leftIcon={<RotateCcw className="w-3 h-3" />}
                    >
                      Retry Question
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-surface-subtle border-t border-surface-border shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  queryScope === 'current' && currentDoc
                    ? `Ask anything about "${currentDoc.filename}"...`
                    : 'Ask questions across all indexed documents...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="glow"
                size="md"
                disabled={!inputMessage.trim() || isSending}
                isLoading={isSending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
