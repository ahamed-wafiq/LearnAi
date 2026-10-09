import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Terminal, Shield, Zap, Sparkles, Code2 } from 'lucide-react';
import { PixelDivider } from './PixelDivider';
import { StarField } from './StarField';

export const RetroFooter: React.FC = () => {
  return (
    <footer className="relative bg-[#070B14] text-white border-t-2 border-[#FF4742] overflow-hidden select-none">
      {/* Starfield in footer background */}
      <StarField className="opacity-40" showMoon={false} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF4742] text-white px-2.5 py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs">
                AI
              </div>
              <div>
                <span className="font-pixel text-lg sm:text-xl font-bold tracking-wider block text-white">
                  LEARN AI
                </span>
                <span className="font-arcade text-[9px] text-[#00E5FF] tracking-widest uppercase block -mt-0.5">
                  AI-POWERED STUDY OS
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A retro-futuristic AI study operating system powered by local RAG, FAISS vector indexing, and Google Gemini.
              Turn your lecture slides and textbooks into an intelligent workspace with page-level citations.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 bg-[#2ECC71] rounded-none animate-pulse" />
              <span className="font-arcade text-[10px] text-[#00E5FF] tracking-wider uppercase">
                SYSTEM ONLINE // LOCAL FAISS READY
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-pixel text-xs text-[#FF4742] uppercase tracking-wider mb-3">
                WORKSPACE
              </h4>
              <ul className="space-y-2 text-xs font-arcade">
                <li>
                  <Link to="/" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    HOME
                  </Link>
                </li>
                <li>
                  <Link to="/library" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    LIBRARY
                  </Link>
                </li>
                <li>
                  <Link to="/study-room" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    AI STUDY ROOM
                  </Link>
                </li>
                <li>
                  <Link to="/practice" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    QUIZ // PRACTICE
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-pixel text-xs text-[#00E5FF] uppercase tracking-wider mb-3">
                INTELLIGENCE
              </h4>
              <ul className="space-y-2 text-xs font-arcade">
                <li>
                  <Link to="/dashboard" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    PROGRESS
                  </Link>
                </li>
                <li>
                  <Link to="/flashcards" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    FLASHCARDS
                  </Link>
                </li>
                <li>
                  <Link to="/planner" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    PLANNER
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="text-slate-300 hover:text-[#00E5FF] transition-colors">
                    CONFIG & API
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Retro Diagnostics & Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-pixel text-xs text-[#F8C02F] uppercase tracking-wider">
              ARCHIVE SPECS
            </h4>
            <div className="bg-[#121829] p-3 border-2 border-[#1E293B] shadow-[2px_2px_0px_#000] font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ENGINE:</span>
                <span className="text-[#00E5FF]">FastAPI + PyMuPDF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VECTOR STORE:</span>
                <span className="text-[#F8C02F]">FAISS FlatIP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LLM MODEL:</span>
                <span className="text-[#FF4742]">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">EMBEDDINGS:</span>
                <span className="text-white">MiniLM-L6-v2</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-[#121829] hover:bg-[#1A2338] text-slate-300 hover:text-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-colors"
                title="View GitHub Repository"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <Link
                to="/study-room"
                className="text-[10px] font-arcade text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                <span>OPEN TERMINAL</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar matching reference styling */}
        <div className="mt-12 pt-6 border-t-2 border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 font-arcade text-[9px] sm:text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="bg-[#FF4742] text-white px-2 py-0.5 border border-[#0C1220]">
              DEPT.28
            </span>
            <span>LEARN AI OS © 2026 // ALL RIGHTS RESERVED.</span>
          </div>

          <div className="flex items-center gap-4 text-[#00E5FF]">
            <span>LOCAL RAG ARCHITECTURE</span>
            <span>•</span>
            <span>ZERO HALLUCINATIONS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
