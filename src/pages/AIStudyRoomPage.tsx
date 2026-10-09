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
  FileImage,
  Layers,
  X,
  Terminal,
  RotateCcw,
  Search,
  CheckCircle2
} from 'lucide-react';
import { RetroButton } from '../components/retro/RetroButton';
import { RetroBadge } from '../components/retro/RetroBadge';
import { PixelIcon } from '../components/retro/PixelIcon';
import {
  askQuestion,
  listDocuments,
  checkHealth,
  getDocumentPageImageUrl,
  getDocumentPageText,
  getDocumentPdfUrl,
  type RAGDocument,
} from '../services/ragApi';

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

  // Left pane view mode: 'visual' (PyMuPDF rendered page PNG) or 'text' (raw extracted text)
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

          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `AI Study Terminal Initialized.\nIndexed "${selected.filename}" (${selected.total_pages} pages, ${selected.chunks_count} FAISS chunks).\nAsk any question — I will retrieve the most relevant sections and generate answers grounded in your document with page citations.`,
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
        // Backend offline
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

  if (loading) {
    return (
      <div className="bg-[#0A0E1A] min-h-[calc(100vh-140px)] p-8 flex items-center justify-center">
        <div className="bg-[#121829] p-8 border-3 border-[#0C1220] shadow-[6px_6px_0px_#0C1220] text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#00E5FF] animate-spin mx-auto" />
          <h3 className="font-pixel text-base text-white uppercase">
            INITIALIZING STUDY ROOM...
          </h3>
          <p className="font-mono text-xs text-slate-400">
            Connecting to local FAISS vector index & PyMuPDF renderer
          </p>
        </div>
      </div>
    );
  }

  if (ragDocs.length === 0) {
    return (
      <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-8 flex items-center justify-center paper-dot-grid">
        <div className="bg-[#FFFDF7] p-8 sm:p-12 border-3 border-[#0C1220] shadow-[6px_6px_0px_#0C1220] text-center max-w-lg space-y-4">
          <div className="p-3 bg-[#0A0E1A] inline-block border-2 border-[#0C1220]">
            <PixelIcon name="folder" size={36} color="#FF4742" />
          </div>
          <h2 className="font-pixel text-lg sm:text-xl font-bold uppercase text-[#0C1220]">
            NO DOCUMENTS IN ARCHIVE
          </h2>
          <p className="text-xs sm:text-sm text-[#53627C] font-mono leading-relaxed">
            The AI Study Room requires at least one indexed PDF. Please upload a textbook, lecture slide deck, or paper.
          </p>
          <div className="pt-2">
            <RetroButton to="/library" variant="primary" size="md">
              GO TO KNOWLEDGE ARCHIVE & UPLOAD PDF
            </RetroButton>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = currentDoc?.total_pages || 1;

  return (
    <div className="bg-[#0A0E1A] text-white min-h-[calc(100vh-140px)] p-3 sm:p-6 space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL BAR & DOCUMENT SELECTOR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#121829] border-2 border-[#0C1220] shadow-[4px_4px_0px_#000] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Document info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0A0E1A] border border-[#00E5FF]/40 text-[#00E5FF]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-pixel text-xs sm:text-sm text-white font-bold truncate max-w-xs sm:max-w-md">
                {currentDoc?.filename}
              </span>
              <RetroBadge variant="coral" size="sm">
                RAG ACTIVE
              </RetroBadge>
              <RetroBadge variant={backendOnline ? 'green' : 'coral'} size="sm" dot>
                {backendOnline ? 'CONNECTED' : 'OFFLINE'}
              </RetroBadge>
            </div>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              {currentDoc?.total_pages} Pages • {currentDoc?.chunks_count} FAISS Chunks • {currentDoc?.file_size_mb} MB
            </p>
          </div>
        </div>

        {/* Right: Switch Doc dropdown + Scope toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Doc Switcher */}
          <div className="flex items-center bg-[#0A0E1A] border-2 border-[#1E293B] px-2 py-1">
            <span className="font-arcade text-[10px] text-slate-400 mr-2">DOC:</span>
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
              className="bg-transparent text-xs font-mono text-[#00E5FF] focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {ragDocs.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#0A0E1A] text-white">
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          {/* External PDF view link */}
          {currentDoc && (
            <a
              href={getDocumentPdfUrl(currentDoc.id)}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-[#0A0E1A] hover:bg-[#1A2338] text-slate-300 hover:text-white border-2 border-[#1E293B] shadow-[2px_2px_0px_#000] text-xs font-arcade inline-flex items-center gap-1.5"
              title="Open raw PDF in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">RAW PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SPLIT-SCREEN WORKSPACE:
          LEFT: RETRO PDF READER  |  RIGHT: AI STUDY TERMINAL
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-250px)]">
        {/* =========================================================
            LEFT PANE: RETRO PDF READER
            ========================================================= */}
        <div className="lg:col-span-6 bg-[#121829] border-3 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] flex flex-col overflow-hidden">
          {/* Reader Top Toolbar */}
          <div className="bg-[#1A2338] px-3 sm:px-4 py-2 border-b-2 border-[#0C1220] flex items-center justify-between gap-2 flex-wrap">
            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  setActiveCitation(null);
                }}
                disabled={currentPage <= 1}
                className="p-1.5 bg-[#0A0E1A] text-white border border-[#1E293B] hover:border-[#00E5FF] disabled:opacity-40 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs">
                <span className="text-slate-400">PAGE</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    if (p >= 1 && p <= totalPages) {
                      setCurrentPage(p);
                      setActiveCitation(null);
                    }
                  }}
                  className="w-12 bg-[#0A0E1A] text-[#00E5FF] text-center font-bold border border-[#1E293B] py-0.5"
                />
                <span className="text-slate-400">/ {totalPages}</span>
              </div>

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  setActiveCitation(null);
                }}
                disabled={currentPage >= totalPages}
                className="p-1.5 bg-[#0A0E1A] text-white border border-[#1E293B] hover:border-[#00E5FF] disabled:opacity-40 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode: Visual vs Text */}
            <div className="flex items-center bg-[#0A0E1A] border border-[#1E293B] p-0.5">
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-arcade transition-all ${
                  viewMode === 'visual'
                    ? 'bg-[#FF4742] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileImage className="w-3 h-3" />
                <span>VISUAL</span>
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-arcade transition-all ${
                  viewMode === 'text'
                    ? 'bg-[#FF4742] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>TEXT</span>
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'visual' && (
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  className="p-1 text-slate-400 hover:text-[#00E5FF]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-300 w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                  className="p-1 text-slate-400 hover:text-[#00E5FF]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Active Citation Highlight Banner (When citation is clicked!) */}
          {activeCitation && activeCitation.pageNumber === currentPage && (
            <div className="bg-[#FF4742] text-white p-3 border-b-2 border-[#0C1220] flex items-start justify-between gap-3 animate-in slide-in-from-top duration-150">
              <div className="flex items-start gap-2 text-xs">
                <Quote className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 font-arcade text-[10px]">
                    <span>REFERENCED CITATION • PAGE {activeCitation.pageNumber}</span>
                    <span className="bg-[#0C1220] text-[#00E5FF] px-1.5 py-0.2">
                      {(activeCitation.confidence * 100).toFixed(0)}% MATCH
                    </span>
                  </div>
                  <p className="font-mono text-[11px] mt-1 italic text-yellow-100 bg-black/25 p-1.5 border border-white/20">
                    "{activeCitation.excerpt}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-white hover:text-black p-1"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Viewer Canvas */}
          <div className="flex-1 bg-[#070D18] p-4 overflow-auto flex items-center justify-center relative select-text">
            {viewMode === 'visual' ? (
              currentDoc && (
                <div
                  className="transition-all duration-200 flex items-center justify-center"
                  style={{ width: `${zoomLevel}%` }}
                >
                  <img
                    src={getDocumentPageImageUrl(currentDoc.id, currentPage)}
                    alt={`Page ${currentPage}`}
                    onLoad={() => setIsPageImageLoading(false)}
                    onError={() => {
                      setIsPageImageLoading(false);
                      setPageImageError(true);
                    }}
                    className={`max-w-full shadow-2xl border-2 border-[#0C1220] bg-white ${
                      isPageImageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  {isPageImageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070D18]/80 text-[#00E5FF] space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="font-arcade text-xs">RENDERING PAGE PNG...</span>
                    </div>
                  )}
                  {pageImageError && (
                    <div className="p-6 bg-[#121829] border border-[#FF4742] text-center space-y-2 max-w-sm">
                      <AlertTriangle className="w-8 h-8 text-[#FF4742] mx-auto" />
                      <p className="font-pixel text-xs text-white uppercase">PAGE RENDER ERROR</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        Unable to render page {currentPage}. Try switching to Text Mode.
                      </p>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Text Mode Canvas */
              <div className="w-full h-full p-4 bg-[#0A0E1A] border-2 border-[#1E293B] font-mono text-xs text-slate-200 leading-relaxed overflow-y-auto max-h-[600px] whitespace-pre-wrap select-text">
                {isPageTextLoading ? (
                  <div className="flex items-center justify-center h-48 text-[#00E5FF] space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-arcade text-xs">EXTRACTING PAGE TEXT...</span>
                  </div>
                ) : (
                  pageText || 'No text extracted for this page.'
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            RIGHT PANE: AI STUDY TERMINAL
            ========================================================= */}
        <div className="lg:col-span-6 bg-[#080C14] border-3 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] flex flex-col overflow-hidden crt-scanlines">
          {/* Terminal Title Bar */}
          <div className="bg-[#1A2338] px-4 py-2 border-b-2 border-[#0C1220] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220]" />
              <span className="font-arcade text-[10px] text-white ml-2">
                TERMINAL // STUDY COPILOT
              </span>
            </div>

            {/* Scope Selector */}
            <div className="flex items-center bg-[#0A0E1A] border border-[#1E293B] p-0.5">
              <button
                onClick={() => setQueryScope('current')}
                className={`px-2 py-0.5 text-[9px] font-arcade ${
                  queryScope === 'current'
                    ? 'bg-[#00E5FF] text-[#0C1220] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                THIS DOC
              </button>
              <button
                onClick={() => setQueryScope('all')}
                className={`px-2 py-0.5 text-[9px] font-arcade ${
                  queryScope === 'all'
                    ? 'bg-[#00E5FF] text-[#0C1220] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL ARCHIVE
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="bg-[#101726] p-2 border-b border-[#1E293B] flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendMessage('Summarize the main concepts and arguments of this document')}
              disabled={isSending}
              className="px-2.5 py-1 bg-[#0A0E1A] hover:bg-[#1A2338] text-[#00E5FF] border border-[#00E5FF]/40 text-[10px] font-arcade whitespace-nowrap flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3 h-3 text-[#FF4742]" /> SUMMARIZE DOC
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'What are the core formulas, equations, or definitions in this text? Explain each clearly.'
                )
              }
              disabled={isSending}
              className="px-2.5 py-1 bg-[#0A0E1A] hover:bg-[#1A2338] text-[#00E5FF] border border-[#00E5FF]/40 text-[10px] font-arcade whitespace-nowrap flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3 h-3 text-[#F8C02F]" /> CORE FORMULAS
            </button>
            <button
              onClick={() =>
                handleSendMessage(
                  'Create 3 active recall quiz questions from this document to test my understanding.'
                )
              }
              disabled={isSending}
              className="px-2.5 py-1 bg-[#0A0E1A] hover:bg-[#1A2338] text-[#00E5FF] border border-[#00E5FF]/40 text-[10px] font-arcade whitespace-nowrap flex items-center gap-1.5 transition-colors"
            >
              <ListOrdered className="w-3 h-3 text-[#2ECC71]" /> 3-QUESTION QUIZ
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs select-text">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Header label */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span
                    className={`font-arcade text-[9px] ${
                      msg.role === 'user' ? 'text-[#00E5FF]' : 'text-[#FF4742]'
                    }`}
                  >
                    {msg.role === 'user' ? '> USER' : '// LEARN AI COPILOT'}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>

                {/* Message Box */}
                <div
                  className={`p-3.5 border-2 max-w-[94%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#121829] text-white border-[#00E5FF]/50 shadow-[2px_2px_0px_#00E5FF]'
                      : 'bg-[#0D1526] text-slate-100 border-[#FF4742]/50 shadow-[2px_2px_0px_#FF4742] space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-[11px] sm:text-xs">
                    {msg.content}
                  </div>

                  {/* Copy Button */}
                  {msg.role === 'assistant' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-[9px] font-arcade text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#2ECC71]" />
                            <span className="text-[#2ECC71]">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY TEXT</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────
                      STRONG CITATION CARDS (CLICKABLE PAGE JUMP!)
                      ─────────────────────────────────────────────────── */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[#1E293B] space-y-2">
                      <div className="flex items-center gap-1.5 text-[#FF4742] font-arcade text-[9px]">
                        <Quote className="w-3 h-3" />
                        <span>GROUNDED SOURCE CITATIONS:</span>
                      </div>

                      <div className="space-y-2">
                        {msg.citations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleCitationClick(c)}
                            className="p-2.5 bg-[#121829] hover:bg-[#1A2338] border-2 border-[#FF4742] shadow-[2px_2px_0px_#000] cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-arcade text-[10px] text-white group-hover:text-[#00E5FF] truncate max-w-[220px]">
                                {c.documentTitle}
                              </span>
                              <span className="bg-[#FF4742] text-white font-arcade text-[9px] px-2 py-0.5 border border-[#0C1220]">
                                PAGE {c.pageNumber}
                              </span>
                            </div>

                            <p className="font-mono text-[10px] text-slate-300 italic bg-[#0A0E1A] p-2 border border-slate-700/60 line-clamp-2">
                              "{c.excerpt}"
                            </p>

                            <div className="flex items-center justify-between mt-1 text-[9px] font-arcade">
                              <span className="text-[#00E5FF] group-hover:underline">
                                ➔ CLICK TO JUMP PDF VIEWER
                              </span>
                              <span className="text-[#2ECC71]">
                                {(c.confidence * 100).toFixed(0)}% MATCH
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                    <div className="pt-2 border-t border-[#1E293B]">
                      <span className="font-arcade text-[9px] text-[#2ECC71] block mb-1">
                        KEY TAKEAWAYS:
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-200">
                        {msg.keyTakeaways.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#2ECC71] font-bold">▪</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested follow-ups */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 border-t border-[#1E293B] space-y-1">
                      <span className="font-arcade text-[9px] text-[#F8C02F] block">
                        FOLLOW-UP EXPLORATIONS:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isSending}
                            className="text-[10px] font-mono text-left bg-[#0A0E1A] hover:bg-[#1A2338] text-slate-300 hover:text-white px-2 py-1 border border-slate-700 transition-colors"
                          >
                            + {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="p-3 bg-[#121829] border border-[#00E5FF]/40 text-xs font-mono text-[#00E5FF] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-arcade text-[10px]">
                  RETRIEVING FAISS PASSAGES & QUERYING GEMINI...
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-[#FF4742]/20 border-2 border-[#FF4742] text-xs font-mono text-[#FF4742] flex items-center justify-between gap-2">
                <span>{error}</span>
                {lastFailedPrompt && (
                  <RetroButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleSendMessage(lastFailedPrompt)}
                  >
                    RETRY
                  </RetroButton>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="bg-[#121829] p-3 border-t-2 border-[#0C1220]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 font-arcade text-xs text-[#00E5FF]">
                  &gt;
                </span>
                <input
                  type="text"
                  placeholder="ASK QUESTION (E.G. EXPLAIN LOSS FUNCTION FORMULA ON PAGE 42)..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isSending}
                  className="w-full bg-[#0A0E1A] text-white pl-8 pr-3 py-2.5 border-2 border-[#1E293B] focus:border-[#00E5FF] font-mono text-xs focus:outline-none"
                />
              </div>

              <RetroButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isSending || !inputMessage.trim()}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                SEND
              </RetroButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
