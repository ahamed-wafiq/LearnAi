import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, ArrowUpRight, Layers, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { RetroButton } from './RetroButton';
import { RetroBadge } from './RetroBadge';
import { PixelIcon } from './PixelIcon';
import { getDocumentPageImageUrl, getDocumentPdfUrl, type RAGDocument } from '../../services/ragApi';

interface DocumentCardProps {
  doc: RAGDocument;
  onDelete: (doc: RAGDocument) => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onDelete, className = '' }) => {
  const navigate = useNavigate();
  const [thumbError, setThumbError] = useState(false);

  const thumbnailUrl = getDocumentPageImageUrl(doc.id, 1);
  const pdfUrl = getDocumentPdfUrl(doc.id);

  return (
    <div
      className={`relative flex flex-col bg-[#FFFDF7] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] pixel-hover overflow-hidden ${className}`}
    >
      {/* Top Hazard Accent Bar */}
      <div className="h-2 w-full retro-hazard-stripes border-b border-[#0C1220]" />

      {/* Card Header & Status */}
      <div className="p-4 pb-2 border-b border-[#0C1220]/15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <RetroBadge variant="coral" size="sm">
            PDF
          </RetroBadge>
          <RetroBadge variant="cyan" size="sm">
            {doc.file_size_mb} MB
          </RetroBadge>
        </div>

        <RetroBadge variant="green" size="sm" dot>
          INDEXED
        </RetroBadge>
      </div>

      {/* Thumbnail + Details */}
      <div className="p-4 flex gap-3.5">
        {/* Document Thumbnail Preview (PyMuPDF Page 1 or fallback pixel art) */}
        <div className="w-20 h-28 shrink-0 bg-[#0A0E1A] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] overflow-hidden flex items-center justify-center relative group">
          {!thumbError ? (
            <img
              src={thumbnailUrl}
              alt={doc.filename}
              onError={() => setThumbError(true)}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="p-2 flex flex-col items-center justify-center text-center">
              <PixelIcon name="document" size={24} color="#00E5FF" />
              <span className="font-arcade text-[8px] text-[#00E5FF] mt-1">DOC</span>
            </div>
          )}
          {/* Subtle CRT scanline overlay on thumbnail */}
          <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-30" />
        </div>

        {/* Metadata info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4
              onClick={() => navigate(`/study-room?doc=${doc.id}`)}
              className="font-pixel font-bold text-xs sm:text-sm text-[#0C1220] hover:text-[#FF4742] transition-colors cursor-pointer line-clamp-2 leading-snug"
              title={doc.filename}
            >
              {doc.filename}
            </h4>

            <div className="mt-2 space-y-1 font-mono text-[11px] text-[#53627C]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FF4742]" />
                <span>{doc.total_pages} Pages ({doc.non_empty_pages} indexed)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>{doc.chunks_count} FAISS Chunks</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3" />
                <span className="truncate">{doc.upload_time || 'Recent'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-[#EDE4CE] border-t-2 border-[#0C1220] flex items-center gap-2">
        <RetroButton
          variant="primary"
          size="sm"
          className="flex-1 text-[10px]"
          onClick={() => navigate(`/study-room?doc=${doc.id}`)}
          rightIcon={<ArrowUpRight className="w-3 h-3" />}
        >
          OPEN STUDY ROOM
        </RetroButton>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 bg-[#FFFDF7] hover:bg-white text-[#0C1220] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-colors"
          title="View Original PDF in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => onDelete(doc)}
          className="p-1.5 bg-[#FF4742] hover:bg-[#FF5F5B] text-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-colors"
          title="Delete document and purge vectors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
