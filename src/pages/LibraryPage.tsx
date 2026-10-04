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
  WifiOff,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
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

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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
        `"${result.document.filename}" processed: ${result.processing.pages_extracted} pages, ${result.processing.chunks_created} chunks indexed in ${result.processing.embedding_time_sec}s`
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
      setRagDocs(ragDocs.filter(d => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDocs = ragDocs.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top action & banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E222A] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#7E79D8]" />
            Knowledge Library & Sources
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload PDFs for AI-powered RAG — ask questions grounded in your study materials
          </p>
        </div>

        <div className="flex items-center gap-2">
          {backendOnline === false ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                Backend offline
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                title="Retry connecting to FastAPI backend"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              title="Refresh document list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              if (backendOnline === false) {
                setUploadError('Backend is offline. Start it with: python main.py in backend/');
                setIsUploadOpen(true);
              } else {
                setUploadError('');
                setIsUploadOpen(true);
              }
            }}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload PDF
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#1E222A]/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1E222A] placeholder-slate-400 focus:outline-none focus:border-[#7E79D8] focus:ring-1 focus:ring-[#7E79D8] transition-all"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'grid'
                ? 'bg-[#7E79D8] border-[#7E79D8] text-white shadow-sm'
                : 'bg-white border-[#1E222A]/10 text-slate-500 hover:text-[#1E222A] hover:bg-slate-50'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'list'
                ? 'bg-[#7E79D8] border-[#7E79D8] text-white shadow-sm'
                : 'bg-white border-[#1E222A]/10 text-slate-500 hover:text-[#1E222A] hover:bg-slate-50'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Grid / List */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={ragDocs.length === 0 ? 'No documents uploaded yet' : 'No matching documents'}
          description={
            ragDocs.length === 0
              ? 'Upload a PDF to get started. The AI will extract text, create searchable chunks, and let you ask questions grounded in your materials.'
              : 'Try adjusting your search query.'
          }
          actionLabel={ragDocs.length === 0 ? 'Upload Your First PDF' : 'Clear Search'}
          onAction={() => {
            if (ragDocs.length === 0) setIsUploadOpen(true);
            else setSearchQuery('');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-card glass-card-hover rounded-2xl p-5 border border-surface-border flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant="primary" size="sm">
                    PDF
                  </Badge>

                  <Badge
                    variant={doc.status === 'ready' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {doc.status === 'ready' && <CheckCircle2 className="w-3 h-3" />}
                    {doc.status === 'ready' ? 'Indexed' : doc.status}
                  </Badge>
                </div>

                {/* Title */}
                <h3
                  onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                  className="text-sm font-bold text-[#1E222A] group-hover:text-[#7E79D8] transition-colors line-clamp-2 cursor-pointer mb-2"
                >
                  {doc.filename}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                  {doc.total_pages} pages extracted • {doc.chunks_count} chunks indexed • {doc.file_size_mb} MB
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    #{doc.total_pages} pages
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    #{doc.chunks_count} chunks
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    Uploaded {doc.upload_time.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Footer & Stats */}
              <div className="pt-3 border-t border-surface-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-primary-400" /> {doc.total_pages} Pages
                  </span>
                  <span>{doc.file_size_mb} MB</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-accent-cyan" /> {doc.chunks_count} Chunks
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="glow"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                    rightIcon={<ArrowUpRight className="w-3 h-3" />}
                  >
                    Open AI Room
                  </Button>
                  <a
                    href={getDocumentPdfUrl(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-[#1E222A] transition-colors"
                    title="View original PDF in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs px-2.5"
                    onClick={() => setDeleteTarget(doc)}
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-surface-border overflow-hidden">
          <div className="divide-y divide-surface-border">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-surface-light/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20 mt-1">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">PDF</Badge>
                      <span className="text-xs text-slate-400">
                        {doc.file_size_mb} MB • {doc.total_pages} pages • {doc.chunks_count} chunks
                      </span>
                    </div>
                    <h4
                      onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                      className="text-sm font-bold text-[#1E222A] hover:text-[#7E79D8] transition-colors cursor-pointer"
                    >
                      {doc.filename}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xl">
                      Uploaded {doc.upload_time} • Status: {doc.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                  >
                    Open in Study Room
                  </Button>
                  <a
                    href={getDocumentPdfUrl(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-[#1E222A] transition-colors"
                    title="View original PDF in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(doc)}
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setUploadError('');
          setUploadSuccess('');
          setUploadProgress(0);
          setUploadedDocId(null);
        }}
        title="Upload Study Material (PDF)"
        description="Upload a PDF document. LearnSphere will extract text page by page, create searchable chunks, and index them for AI-powered Q&A."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary-400 bg-primary-500/15 scale-[1.01]'
                : uploadFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-primary-500/30 hover:border-primary-500/60 bg-primary-500/5'
            }`}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,application/pdf';
              input.onchange = (e: any) => {
                if (e.target.files?.[0]) {
                  setUploadFile(e.target.files[0]);
                  setUploadError('');
                  setUploadSuccess('');
                  setUploadedDocId(null);
                }
              };
              input.click();
            }}
          >
            {uploadFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E222A] line-clamp-1">
                    {uploadFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload & index
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadFile(null);
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 mt-1 underline"
                >
                  <X className="w-3 h-3" /> Choose another file
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-9 h-9 text-[#7E79D8] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1E222A]">
                  {isDragging ? 'Drop your PDF here' : 'Click to select or drag & drop PDF here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Extracts text, breaks into overlapping chunks, builds embeddings & indexes into FAISS
                </p>
              </div>
            )}
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Uploading & processing...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress >= 100 && (
                <p className="text-xs text-accent-cyan animate-pulse">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Extracting text, chunking, and building embeddings...
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success message */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Upload & Indexing Complete!</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">{uploadSuccess}</p>
              {uploadedDocId && (
                <div className="pt-1 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="glow"
                    size="sm"
                    className="text-xs w-full sm:w-auto"
                    onClick={() => {
                      setIsUploadOpen(false);
                      navigate(`/study-room?doc=${uploadedDocId}`);
                    }}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Open in AI Study Room Now
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsUploadOpen(false);
                setUploadError('');
                setUploadSuccess('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="glow"
              isLoading={isUploading}
              disabled={!uploadFile || isUploading || backendOnline === false}
            >
              {isUploading ? 'Processing with AI...' : 'Upload & Index'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Document"
        description={`This will permanently remove "${deleteTarget?.filename}" and all its indexed chunks from the vector store.`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            This action cannot be undone. The document's embeddings will be removed from the FAISS index.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <Trash2 className="w-3 h-3" /> Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
