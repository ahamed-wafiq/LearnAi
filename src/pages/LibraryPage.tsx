import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  BookOpen,
  Search,
  FileText,
  Sparkles,
  Layers,
  ArrowUpRight,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Trash2,
  RefreshCw,
  ExternalLink,
  X,
  Plus,
  Terminal,
  Database
} from 'lucide-react';
import { RetroButton } from '../components/retro/RetroButton';
import { RetroBadge } from '../components/retro/RetroBadge';
import { DocumentCard } from '../components/retro/DocumentCard';
import { SectionHeader } from '../components/retro/SectionHeader';
import { PixelIcon } from '../components/retro/PixelIcon';
import {
  uploadPDF,
  listDocuments,
  deleteDocument,
  checkHealth,
  getDocumentPdfUrl,
  type RAGDocument,
} from '../services/ragApi';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ragDocs, setRagDocs] = useState<RAGDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<RAGDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Backend status
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await checkHealth();
        setBackendOnline(true);
        const docs = await listDocuments();
        setRagDocs(docs);
      } catch {
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkHealth();
      setBackendOnline(true);
      const docs = await listDocuments();
      setRagDocs(docs);
    } catch {
      setBackendOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setUploadFile(file);
        setUploadError('');
        setUploadSuccess('');
      } else {
        setUploadError('Only PDF files are supported. Please drop a valid .pdf file.');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');
    setUploadedDocId(null);

    try {
      const result = await uploadPDF(uploadFile, (pct) => setUploadProgress(pct));
      setRagDocs([result.document, ...ragDocs]);
      setUploadedDocId(result.document.id);
      setUploadSuccess(
        `"${result.document.filename}" indexed: ${result.processing.pages_extracted} pages, ${result.processing.chunks_created} chunks added in ${result.processing.embedding_time_sec}s`
      );
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setRagDocs(ragDocs.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDocs = ragDocs.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPagesCount = ragDocs.reduce((acc, d) => acc + (d.total_pages || 0), 0);
  const totalChunksCount = ragDocs.reduce((acc, d) => acc + (d.chunks_count || 0), 0);

  return (
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] py-8 sm:py-12 paper-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#0C1220] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RetroBadge variant="coral" size="sm">
                ARCHIVE MODULE
              </RetroBadge>
              <RetroBadge variant={backendOnline ? 'green' : 'coral'} size="sm" dot>
                {backendOnline ? 'LOCAL FAISS ONLINE' : 'BACKEND OFFLINE'}
              </RetroBadge>
            </div>
            <h1 className="font-pixel text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#0C1220]">
              KNOWLEDGE ARCHIVE
            </h1>
            <p className="text-xs sm:text-sm text-[#53627C] font-sans mt-1">
              Your indexed study materials. Every document is chunked and vector-embedded for citation retrieval.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-[#FFFDF7] p-2.5 sm:p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-center min-w-[90px]">
              <span className="font-arcade text-[9px] text-[#53627C] uppercase block">DOCS</span>
              <span className="font-pixel text-base font-bold text-[#FF4742]">
                {ragDocs.length}
              </span>
            </div>

            <div className="bg-[#FFFDF7] p-2.5 sm:p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-center min-w-[90px]">
              <span className="font-arcade text-[9px] text-[#53627C] uppercase block">PAGES</span>
              <span className="font-pixel text-base font-bold text-[#00E5FF] text-stroke-dark">
                {totalPagesCount}
              </span>
            </div>

            <div className="bg-[#FFFDF7] p-2.5 sm:p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-center min-w-[90px]">
              <span className="font-arcade text-[9px] text-[#53627C] uppercase block">CHUNKS</span>
              <span className="font-pixel text-base font-bold text-[#F8C02F]">
                {totalChunksCount}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-[#FFFDF7] hover:bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] active:translate-x-0.5 active:translate-y-0.5 transition-all text-[#0C1220]"
              title="Refresh Knowledge Archive"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#FF4742]' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FUTURISTIC RETRO TERMINAL UPLOAD DROPZONE
            [ + DROP PDF INTO KNOWLEDGE ARCHIVE ]
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#0A0E1A] text-white border-3 border-[#0C1220] shadow-[6px_6px_0px_#0C1220] overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="bg-[#1A2338] px-4 py-2 border-b-2 border-[#0C1220] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220]" />
              <span className="font-arcade text-[10px] text-white ml-2">
                TERMINAL // INGESTION STATION
              </span>
            </div>
            <span className="font-arcade text-[9px] text-[#00E5FF]">
              FAISS INGESTION PROTOCOL
            </span>
          </div>

          <div className="p-6 sm:p-8 crt-scanlines">
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[inset_0_0_20px_rgba(0,229,255,0.2)]'
                    : 'border-[#1E293B] hover:border-[#FF4742] bg-[#121829]/60 hover:bg-[#121829]'
                }`}
                onClick={() => {
                  const input = document.getElementById('pdf-file-input');
                  if (input) input.click();
                }}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      setUploadError('');
                      setUploadSuccess('');
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-[#0A0E1A] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220]">
                    <PixelIcon name="document" size={32} color="#00E5FF" />
                  </div>

                  <div>
                    <h3 className="font-pixel text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                      [ + DROP PDF INTO KNOWLEDGE ARCHIVE ]
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Drag & drop your textbook, slides, or research paper, or click to browse
                    </p>
                  </div>

                  {uploadFile && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#1A2338] border border-[#00E5FF] text-xs font-mono text-[#00E5FF]">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-bold">{uploadFile.name}</span>
                      <span className="text-slate-400">
                        ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress & Status Messages */}
              {isUploading && (
                <div className="bg-[#121829] p-4 border border-[#00E5FF]/40 space-y-2">
                  <div className="flex justify-between text-xs font-arcade text-[#00E5FF]">
                    <span>INDEXING IN PROGRESS...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  {/* Retro segmented progress bar */}
                  <div className="w-full bg-[#0A0E1A] h-4 border border-[#0C1220] p-0.5">
                    <div
                      className="h-full bg-[#FF4742] transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="font-mono text-[11px] text-slate-400">
                    Extracting pages with PyMuPDF → Generating embeddings with MiniLM → Indexing vectors in FAISS...
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-[#FF4742]/20 border-2 border-[#FF4742] text-xs font-mono text-[#FF4742] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3.5 bg-[#2ECC71]/15 border-2 border-[#2ECC71] text-xs font-mono text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                  {uploadedDocId && (
                    <RetroButton
                      to={`/study-room?doc=${uploadedDocId}`}
                      variant="cyan"
                      size="sm"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      OPEN STUDY ROOM NOW
                    </RetroButton>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {uploadFile && !isUploading && (
                <div className="flex justify-end">
                  <RetroButton
                    type="submit"
                    variant="primary"
                    size="md"
                    rightIcon={<Upload className="w-4 h-4" />}
                  >
                    START VECTOR INGESTION
                  </RetroButton>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SEARCH & VIEW CONTROLS
            ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="SEARCH ARCHIVE BY TITLE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFDF7] text-[#0C1220] pl-10 pr-4 py-2.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#FF4742]"
            />
            <Search className="w-4 h-4 text-[#0C1220] absolute left-3 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-[#0C1220]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 select-none self-end sm:self-auto">
            <span className="font-arcade text-[10px] text-[#53627C] uppercase mr-1">
              VIEW:
            </span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-colors ${
                viewMode === 'grid' ? 'bg-[#FF4742] text-white' : 'bg-[#FFFDF7] text-[#0C1220]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-colors ${
                viewMode === 'list' ? 'bg-[#FF4742] text-white' : 'bg-[#FFFDF7] text-[#0C1220]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INDEXED DOCUMENTS GRID / LIST
            ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-[#EDE4CE] border-2 border-[#0C1220]" />
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={(target) => setDeleteTarget(target)}
                />
              ))}
            </div>
          ) : (
            /* Retro List View */
            <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] divide-y-2 divide-[#0C1220]/20 overflow-hidden">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBF5E6] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#0A0E1A] text-[#00E5FF] border border-[#0C1220] shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <RetroBadge variant="coral" size="sm">
                          PDF
                        </RetroBadge>
                        <span className="font-mono text-xs text-[#53627C]">
                          {doc.file_size_mb} MB • {doc.total_pages} Pages • {doc.chunks_count} Chunks
                        </span>
                      </div>
                      <h4
                        onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                        className="font-pixel text-sm font-bold text-[#0C1220] hover:text-[#FF4742] cursor-pointer"
                      >
                        {doc.filename}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        Uploaded {doc.upload_time || 'Recent'} • Status: {doc.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RetroButton
                      to={`/study-room?doc=${doc.id}`}
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowUpRight className="w-3 h-3" />}
                    >
                      OPEN IN STUDY ROOM
                    </RetroButton>
                    <a
                      href={getDocumentPdfUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-[#FFFDF7] hover:bg-white text-[#0C1220] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]"
                      title="View PDF in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-2 bg-[#FF4742] hover:bg-[#FF5F5B] text-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="bg-[#FFFDF7] p-12 text-center border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] space-y-3">
            <div className="inline-block p-4 bg-[#0A0E1A] border-2 border-[#0C1220]">
              <PixelIcon name="folder" size={36} color="#FF4742" />
            </div>
            <h3 className="font-pixel text-base font-bold text-[#0C1220] uppercase">
              NO MATCHING DOCUMENTS FOUND
            </h3>
            <p className="text-xs text-[#53627C] max-w-sm mx-auto font-mono">
              {searchQuery
                ? `No documents matched "${searchQuery}". Clear your search query.`
                : 'Your Knowledge Archive is empty. Drop a PDF above to begin.'}
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0A0E1A] text-white border-3 border-[#FF4742] shadow-[8px_8px_0px_#000] max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#FF4742]">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-pixel text-base font-bold uppercase">
                  DELETE FROM ARCHIVE?
                </h3>
              </div>

              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="text-[#FF4742] font-bold">"{deleteTarget.filename}"</span>?
                This permanently purges its vector embeddings from the FAISS index.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <RetroButton
                  variant="dark"
                  size="sm"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  CANCEL
                </RetroButton>
                <RetroButton
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'PURGING...' : 'PURGE DOCUMENT'}
                </RetroButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
