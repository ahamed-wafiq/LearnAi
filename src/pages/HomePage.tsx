import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckSquare,
  Sparkles,
  FileText,
  Layers,
  Zap,
  Terminal,
  ExternalLink,
  ChevronRight,
  Quote,
  ShieldCheck,
  Search,
  Upload,
  Cpu,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { StarField } from '../components/retro/StarField';
import { PixelDivider } from '../components/retro/PixelDivider';
import { RetroButton } from '../components/retro/RetroButton';
import { RetroBadge } from '../components/retro/RetroBadge';
import { PixelCard } from '../components/retro/PixelCard';
import { SectionHeader } from '../components/retro/SectionHeader';
import { TerminalWindow } from '../components/retro/TerminalWindow';
import { FeatureCard } from '../components/retro/FeatureCard';
import { PixelIcon, PixelIconName } from '../components/retro/PixelIcon';
import { checkHealth, listDocuments, type RAGHealthResponse, type RAGDocument } from '../services/ragApi';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<RAGHealthResponse | null>(null);
  const [docs, setDocs] = useState<RAGDocument[]>([]);
  const [simulatedPage, setSimulatedPage] = useState<number>(42);
  const [isCitationActive, setIsCitationActive] = useState<boolean>(true);

  useEffect(() => {
    checkHealth()
      .then((data) => setHealth(data))
      .catch(() => {});
    listDocuments()
      .then((d) => setDocs(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col selection:bg-[#FF4742] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: RETRO-FUTURISTIC AI STUDY LAB IN SPACE
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-14 pb-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#0A0E1A] via-[#0D1424] to-[#0A0E1A]">
        {/* Starfield with Crescent Moon & Twinkling 4-Point Stars */}
        <StarField showMoon={true} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top System Status Tag */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121829] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
              <span className="w-2 h-2 bg-[#00E5FF] rounded-none animate-pulse" />
              <span className="font-arcade text-[10px] text-[#00E5FF] tracking-wider uppercase">
                {health?.status === 'ok' ? 'SYSTEM OPERATIONAL // LOCAL FAISS ACTIVE' : 'LEARNSPHERE OS // KNOWLEDGE CO-PILOT'}
              </span>
            </div>
          </div>

          {/* Hero Copy (Specified Exactly in User Prompt) */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="font-pixel text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              LEARNSPHERE
            </h1>
            <p className="font-arcade text-xs sm:text-sm text-[#FF4742] tracking-widest uppercase">
              AI-POWERED STUDY OS
            </p>
            <h2 className="font-pixel text-lg sm:text-2xl text-[#00E5FF] tracking-normal font-normal max-w-2xl mx-auto">
              "Turn your study materials into an intelligent learning space."
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed pt-1">
              Upload textbooks, lecture slides, and research papers. Ask questions, receive zero-hallucination
              grounded answers, and jump directly to cited source pages.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <RetroButton
                to="/study-room"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                ENTER STUDY OS
              </RetroButton>

              <RetroButton
                to="/library"
                variant="cyan"
                size="lg"
                rightIcon={<FolderOpen className="w-4 h-4" />}
              >
                EXPLORE LIBRARY
              </RetroButton>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CENTRAL RETRO AI TERMINAL & CYBER PLATFORM
              ───────────────────────────────────────────────────────── */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto relative">
            {/* Floating Document Left */}
            <div className="hidden lg:block absolute -left-12 top-10 z-20 animate-float-slow select-none">
              <div className="w-44 bg-[#FFFDF7] text-[#0C1220] p-3 border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220]">
                <div className="h-1.5 w-full retro-hazard-stripes mb-2 border-b border-[#0C1220]" />
                <div className="flex items-center gap-1.5 text-[9px] font-arcade text-[#FF4742]">
                  <FileText className="w-3 h-3" />
                  <span>PDF SOURCE</span>
                </div>
                <p className="font-pixel text-[10px] font-bold mt-1 truncate">
                  ml_study_guide.pdf
                </p>
                <div className="mt-2 text-[9px] font-mono text-slate-600 bg-slate-100 p-1.5 border border-slate-300">
                  Page 42: "Gradient descent computes parameter updates via loss gradients..."
                </div>
              </div>
            </div>

            {/* Floating Document Right */}
            <div className="hidden lg:block absolute -right-12 top-20 z-20 animate-float-delayed select-none">
              <div className="w-48 bg-[#FFFDF7] text-[#0C1220] p-3 border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220]">
                <div className="h-1.5 w-full retro-hazard-stripes-cyan mb-2 border-b border-[#0C1220]" />
                <div className="flex items-center gap-1.5 text-[9px] font-arcade text-[#00E5FF]">
                  <Layers className="w-3 h-3 text-[#0C1220]" />
                  <span>FAISS VECTOR STORE</span>
                </div>
                <p className="font-pixel text-[10px] font-bold mt-1 truncate">
                  Top-K Chunk Matched
                </p>
                <div className="mt-2 text-[9px] font-mono text-slate-600 bg-slate-100 p-1.5 border border-slate-300">
                  Similarity Cosine: 0.94
                  <br />
                  Model: MiniLM-L6-v2
                </div>
              </div>
            </div>

            {/* Central Main Computer / AI Terminal (Inspired by reference monitor) */}
            <div className="relative z-10 border-3 sm:border-4 border-[#0C1220] bg-[#121829] shadow-[8px_8px_0px_#0C1220] overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="bg-[#1A2338] px-4 py-2.5 border-b-3 border-[#0C1220] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#FF4742] border border-[#0C1220]" />
                  <span className="w-3 h-3 bg-[#F8C02F] border border-[#0C1220]" />
                  <span className="w-3 h-3 bg-[#00E5FF] border border-[#0C1220]" />
                  <span className="font-arcade text-[10px] sm:text-xs text-[#FBF5E6] ml-2 tracking-wider">
                    LEARNSPHERE TERMINAL // CO-PILOT ROOM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-arcade text-[9px] bg-[#0A0E1A] text-[#00E5FF] px-2 py-0.5 border border-[#00E5FF]/40">
                    STATUS: READY
                  </span>
                </div>
              </div>

              {/* Terminal Screen with CRT Scanlines & Visual Split */}
              <div className="p-4 sm:p-6 bg-[#070D18] crt-scanlines grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Left Mini Viewer Preview */}
                <div className="md:col-span-5 bg-[#0C1220] p-3 border-2 border-[#1E293B] shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center justify-between text-[10px] font-arcade text-slate-400 mb-2 pb-1 border-b border-[#1E293B]">
                    <span>PAGE VIEWER</span>
                    <span className="text-[#FF4742]">PAGE 42 / 128</span>
                  </div>
                  {/* Simulated Document Page Render */}
                  <div className="bg-[#FBF5E6] text-[#0C1220] p-3 border border-[#0C1220] font-mono text-[10px] space-y-1.5 shadow-inner min-h-[160px]">
                    <div className="font-bold border-b border-[#0C1220] pb-1 text-[#FF4742]">
                      § 4.2 Optimization & Loss
                    </div>
                    <p className="text-[9px] leading-relaxed text-[#2A2E37]">
                      In deep architectures, gradient descent updates weight vectors <span className="font-bold text-[#FF4742]">θ := θ − η ∇J(θ)</span> where learning rate η governs step magnitude.
                    </p>
                    <div className="bg-[#FFE5B4] p-1.5 border border-[#D97706] text-[8px] font-bold">
                      [HIGHLIGHTED SOURCE PASSAGE]
                    </div>
                  </div>
                </div>

                {/* Right Interactive AI Conversation Mockup */}
                <div className="md:col-span-7 space-y-3">
                  <div className="bg-[#121829] p-3 border border-[#00E5FF]/30 text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2 text-[#00E5FF] font-arcade text-[10px]">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>STUDENT PROMPT</span>
                    </div>
                    <p className="text-slate-200">
                      "How does gradient descent update parameters in Section 4.2?"
                    </p>
                  </div>

                  <div className="bg-[#0D1527] p-3.5 border-2 border-[#FF4742]/50 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-arcade text-[#FF4742]">
                      <span className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" />
                        <span>LEARNSPHERE RAG ENGINE</span>
                      </span>
                      <span className="text-[#2ECC71]">GROUNDED ANSWER</span>
                    </div>

                    <p className="text-slate-100 leading-relaxed text-[11px]">
                      Gradient descent iteratively shifts weight parameters opposite the cost function gradient.
                      The update rule computes:
                    </p>

                    <div className="bg-[#050B14] p-2 border border-[#00E5FF]/30 text-[#00E5FF] font-mono text-center text-xs">
                      θ := θ − η ∇J(θ)
                    </div>

                    {/* Interactive Citation Chip */}
                    <div className="pt-1 flex items-center justify-between gap-2 bg-[#1A2338] p-2 border border-[#FF4742]">
                      <div className="flex items-center gap-2">
                        <Quote className="w-3.5 h-3.5 text-[#FF4742]" />
                        <span className="font-arcade text-[9px] text-[#FBF5E6]">
                          CITATION // PAGE 42 (98% MATCH)
                        </span>
                      </div>
                      <span className="font-arcade text-[8px] text-[#00E5FF] animate-pulse">
                        [ANCHORED TO VIEWER]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perspective Cyber Grid Floor (matching reference stage floor) */}
            <div className="h-16 sm:h-20 w-full perspective-grid border-t-2 border-[#00E5FF]/30 -mt-2 relative">
              {/* Flanking Modular Hardware Pedestals */}
              <div className="absolute left-4 -top-8 w-14 sm:w-20 h-10 bg-[#FF4742] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center font-arcade text-[8px] text-white">
                MOD-01
              </div>
              <div className="absolute right-4 -top-8 w-14 sm:w-20 h-10 bg-[#FF4742] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center font-arcade text-[8px] text-white">
                MOD-02
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE SCALLOPED DIVIDER (DARK SPACE -> WARM CREAM PAPER)
          ───────────────────────────────────────────────────────────── */}
      <PixelDivider variant="dark-to-paper" />

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION 1: "YOUR STUDY MATERIALS, NOW INTELLIGENT" (PAPER)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#FBF5E6] text-[#0C1220] py-16 sm:py-24 paper-dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tag="ARCHITECTURE OVERVIEW"
            tagColor="coral"
            title="YOUR STUDY MATERIALS, NOW INTELLIGENT"
            subtitle="LearnSphere transforms dense documents into an interactive, conversational study OS. Upload lecture notes, query with zero hallucinations, and trace every insight back to its origin."
            variant="paper"
          />

          {/* 3 Core Workflow Cards */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: INGEST */}
            <PixelCard
              variant="paper"
              hazardHeader={true}
              hazardColor="coral"
              tag="STEP 01"
              tagColor="coral"
              title="1. INGEST"
              subtitle="Document Extraction"
            >
              <div className="p-3 bg-[#0A0E1A] border-2 border-[#0C1220] mb-4 flex items-center justify-center">
                <PixelIcon name="document" size={36} color="#FF4742" />
              </div>
              <p className="text-xs sm:text-sm text-[#53627C] leading-relaxed">
                Upload textbooks, lecture slides, research papers, and syllabi in PDF format.
                PyMuPDF extracts raw text, diagrams, formulas, and preserves exact page coordinates.
              </p>
              <div className="mt-4 pt-3 border-t border-[#0C1220]/15 flex items-center justify-between text-[10px] font-arcade text-[#FF4742]">
                <span>INPUT // PDF FORMAT</span>
                <span>PAGE-AWARE</span>
              </div>
            </PixelCard>

            {/* Card 2: UNDERSTAND */}
            <PixelCard
              variant="paper"
              hazardHeader={true}
              hazardColor="cyan"
              tag="STEP 02"
              tagColor="cyan"
              title="2. UNDERSTAND"
              subtitle="Chunking & Vector Indexing"
            >
              <div className="p-3 bg-[#0A0E1A] border-2 border-[#0C1220] mb-4 flex items-center justify-center">
                <PixelIcon name="chip" size={36} color="#00E5FF" />
              </div>
              <p className="text-xs sm:text-sm text-[#53627C] leading-relaxed">
                Documents are split into dense overlapping chunks, embedded via SentenceTransformers
                into high-dimensional vectors, and indexed locally in a lightning-fast FAISS FlatIP index.
              </p>
              <div className="mt-4 pt-3 border-t border-[#0C1220]/15 flex items-center justify-between text-[10px] font-arcade text-[#00E5FF]">
                <span>STORE // FAISS INDEX</span>
                <span>LOCAL & PRIVATE</span>
              </div>
            </PixelCard>

            {/* Card 3: LEARN */}
            <PixelCard
              variant="paper"
              hazardHeader={true}
              hazardColor="coral"
              tag="STEP 03"
              tagColor="coral"
              title="3. LEARN"
              subtitle="Grounded Retrieval & Study Room"
            >
              <div className="p-3 bg-[#0A0E1A] border-2 border-[#0C1220] mb-4 flex items-center justify-center">
                <PixelIcon name="brain" size={36} color="#F8C02F" />
              </div>
              <p className="text-xs sm:text-sm text-[#53627C] leading-relaxed">
                Ask challenging questions. Top relevant passages are retrieved and synthesized by Gemini
                with page citations. Click any citation to jump straight to the source page.
              </p>
              <div className="mt-4 pt-3 border-t border-[#0C1220]/15 flex items-center justify-between text-[10px] font-arcade text-[#FF4742]">
                <span>CITATIONS // ONE-CLICK JUMP</span>
                <span>ACCURATE</span>
              </div>
            </PixelCard>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. RAG FEATURE SECTION: LOCAL PIPELINE VISUALIZATION
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#101626] text-white py-16 sm:py-24 border-y-2 border-[#0C1220] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tag="LOCAL PIPELINE"
            tagColor="cyan"
            title="YOUR DOCUMENTS. YOUR KNOWLEDGE."
            subtitle="Everything runs directly against your uploaded files. No generic internet scraping, no ungrounded hallucinations. An auditable, verified intelligence loop."
            variant="dark"
          />

          {/* Visual RAG Pipeline (Specified in Section 6) */}
          <div className="mt-12 sm:mt-16 bg-[#0A0E1A] p-6 sm:p-8 border-3 border-[#0C1220] shadow-[6px_6px_0px_#0C1220]">
            <div className="text-center mb-6">
              <span className="font-arcade text-xs text-[#00E5FF] tracking-widest uppercase">
                // END-TO-END LOCAL RAG COMPUTATION //
              </span>
            </div>

            {/* Pipeline Steps in Retro Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 items-center">
              {[
                { label: 'PDF', sub: 'Upload', icon: 'document', color: 'coral' },
                { label: 'EXTRACT', sub: 'PyMuPDF', icon: 'folder', color: 'cyan' },
                { label: 'CHUNK', sub: 'Overlap', icon: 'layers', color: 'yellow' },
                { label: 'EMBED', sub: 'MiniLM-v2', icon: 'chip', color: 'cyan' },
                { label: 'FAISS', sub: 'Vector DB', icon: 'database', color: 'coral' },
                { label: 'RETRIEVE', sub: 'Cosine IP', icon: 'search', color: 'cyan' },
                { label: 'GEMINI', sub: 'Grounded LLM', icon: 'brain', color: 'yellow' },
                { label: 'ANSWER', sub: 'With Citations', icon: 'check', color: 'coral' },
              ].map((step, idx) => (
                <div key={step.label} className="flex flex-col items-center text-center group">
                  <div className="w-full bg-[#121829] p-3 border-2 border-[#1E293B] shadow-[2px_2px_0px_#000] group-hover:border-[#00E5FF] transition-all">
                    <span className="font-arcade text-[9px] text-slate-500 block mb-1">
                      0{idx + 1}
                    </span>
                    <span className="font-pixel text-[11px] sm:text-xs font-bold text-white block truncate">
                      {step.label}
                    </span>
                    <span className="text-[9px] font-mono text-[#00E5FF] block mt-0.5">
                      {step.sub}
                    </span>
                  </div>
                  {idx < 7 && (
                    <div className="hidden lg:block text-[#FF4742] font-pixel text-xs my-1">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pipeline Highlights Bar */}
            <div className="mt-8 pt-6 border-t-2 border-[#1E293B] grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#121829] border border-[#1E293B]">
                <div className="font-pixel text-xs text-[#FF4742] font-bold">LOCAL INDEX</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">100% On-Premise Vector Cache</div>
              </div>
              <div className="p-3 bg-[#121829] border border-[#1E293B]">
                <div className="font-pixel text-xs text-[#00E5FF] font-bold">PAGE CITATIONS</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Precision Sentence Anchors</div>
              </div>
              <div className="p-3 bg-[#121829] border border-[#1E293B]">
                <div className="font-pixel text-xs text-[#F8C02F] font-bold">GROUNDED ANSWERS</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Strict Hallucination Block</div>
              </div>
              <div className="p-3 bg-[#121829] border border-[#1E293B]">
                <div className="font-pixel text-xs text-[#2ECC71] font-bold">FAST RETRIEVAL</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">&lt; 35ms Sub-Vector Query</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. AI STUDY ROOM SHOWCASE SECTION (SPLIT-SCREEN INTERACTION)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#FBF5E6] text-[#0C1220] py-16 sm:py-24 paper-dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tag="STUDY WORKSPACE"
            tagColor="coral"
            title="THE SPLIT-SCREEN STUDY EXPERIENCE"
            subtitle="Connect AI questions directly to original pages. Inspect high-resolution page layouts on the left, collaborate with the AI Copilot on the right, and jump instantly when citations are referenced."
            variant="paper"
          />

          <div className="mt-12 sm:mt-16 bg-[#0A0E1A] text-white border-3 sm:border-4 border-[#0C1220] shadow-[8px_8px_0px_#0C1220] overflow-hidden">
            {/* Window Bar */}
            <div className="bg-[#1A2338] px-4 py-2.5 border-b-2 border-[#0C1220] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220]" />
                <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220]" />
                <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220]" />
                <span className="font-arcade text-xs text-white ml-2">
                  STUDY ROOM // SPLIT-SCREEN CITATION ENGINE
                </span>
              </div>
              <RetroBadge variant="cyan" size="sm">
                ACTIVE SESSION
              </RetroBadge>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Left: PDF Page Viewer */}
              <div className="lg:col-span-6 bg-[#121829] p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#0C1220] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-arcade text-slate-300 pb-3 border-b border-white/10 mb-4">
                    <span className="text-[#00E5FF]">RETRO PDF VIEWER</span>
                    <span>PAGE {simulatedPage} / 120</span>
                  </div>

                  {/* Citation banner highlight */}
                  <div className="mb-4 bg-[#FF4742]/15 border-2 border-[#FF4742] p-3 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-arcade text-[#FF4742]">
                      <span>VERIFIED CITATION ANCHOR</span>
                      <span>PAGE {simulatedPage}</span>
                    </div>
                    <p className="text-slate-200 italic">
                      "Loss functions penalize deviation between predicted output and ground truth label..."
                    </p>
                  </div>

                  {/* Visual Page Simulation */}
                  <div className="bg-[#FFFDF7] text-[#0C1220] p-4 border-2 border-[#0C1220] font-sans text-xs space-y-2 shadow-inner">
                    <div className="font-pixel text-xs text-[#FF4742] font-bold">
                      Chapter 3: Objective Functions
                    </div>
                    <p className="text-[#2A2E37] leading-relaxed text-[11px]">
                      A loss function <span className="font-mono bg-yellow-200 px-1 font-bold">L(y, ŷ)</span> quantifies discrepancy.
                      In classification, Cross-Entropy Loss measures divergence between predicted probability distributions.
                    </p>
                    <div className="p-2 bg-slate-100 border border-slate-300 font-mono text-[10px] text-center">
                      L_CE = − ∑ y_i · log(p_i)
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-arcade text-slate-400">
                  <span>SCALE: 100%</span>
                  <span>MODE: VISUAL RENDER</span>
                  <span className="text-[#2ECC71]">PyMuPDF ENGINE</span>
                </div>
              </div>

              {/* Right: AI Chat & Citation Anchor */}
              <div className="lg:col-span-6 bg-[#080C14] p-4 sm:p-6 flex flex-col justify-between crt-scanlines">
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] font-arcade text-[#00E5FF] pb-2 border-b border-white/10">
                    <span>AI STUDY TERMINAL</span>
                    <span>SESSION // ACTIVE</span>
                  </div>

                  <div className="bg-[#121829] p-3 border border-[#1E293B]">
                    <span className="text-[10px] font-arcade text-slate-400 block mb-1">
                      USER QUESTION:
                    </span>
                    <p className="text-slate-100">
                      "What formula does the document use for cross-entropy loss?"
                    </p>
                  </div>

                  <div className="bg-[#0C162A] p-3.5 border-2 border-[#00E5FF]/40 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-arcade text-[#00E5FF]">
                      <span>AI COPILOT</span>
                      <span>RETRIEVED FROM SOURCE</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">
                      The document defines Cross-Entropy Loss on Page 42 as the logarithmic divergence:
                    </p>
                    <div className="bg-black/50 p-2 text-center text-[#00E5FF] border border-[#00E5FF]/30 font-bold">
                      L_CE = − ∑ y_i · log(p_i)
                    </div>

                    {/* The Clickable Citation Card */}
                    <div
                      onClick={() => setSimulatedPage(42)}
                      className="p-2.5 bg-[#FF4742] text-white border border-[#0C1220] shadow-[2px_2px_0px_#0C1220] cursor-pointer hover:bg-[#FF5F5B] transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Quote className="w-3.5 h-3.5" />
                        <span className="font-arcade text-[10px]">
                          [CITATION — PAGE 42]
                        </span>
                      </div>
                      <span className="font-arcade text-[9px] bg-[#0C1220] px-2 py-0.5 text-[#00E5FF]">
                        CLICK TO JUMP VIEWER
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-arcade text-[10px] text-[#2ECC71]">
                    ● GROUNDED IN LOCAL DOCUMENT
                  </span>
                  <RetroButton to="/study-room" variant="cyan" size="sm">
                    OPEN WORKSPACE
                  </RetroButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FEATURES GRID (12 RETRO CARDS ON WARM CREAM CANVAS)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#FBF5E6] text-[#0C1220] py-16 sm:py-24 border-t-2 border-[#0C1220] paper-dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tag="SYSTEM CAPABILITIES"
            tagColor="coral"
            title="THE COMPLETE STUDY OPERATING SYSTEM"
            subtitle="Built from first principles for students, researchers, and engineers who demand rigorous, verifiable learning from their own materials."
            variant="paper"
          />

          {/* 12 Features Grid (Specified in Section 8) */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[
              {
                title: 'PDF KNOWLEDGE LIBRARY',
                desc: 'Upload multi-page textbooks, slide decks, and papers with automated metadata extraction.',
                icon: 'folder' as PixelIconName,
                color: 'coral' as const,
                tag: 'ARCHIVE',
              },
              {
                title: 'LOCAL RAG',
                desc: '100% private document extraction, chunking, and embedding with zero third-party data leaks.',
                icon: 'database' as PixelIconName,
                color: 'cyan' as const,
                tag: 'RAG',
              },
              {
                title: 'PAGE-LEVEL CITATIONS',
                desc: 'Every AI claim references exact source page numbers and quote excerpts for immediate audit.',
                icon: 'citation' as PixelIconName,
                color: 'coral' as const,
                tag: 'VERIFY',
              },
              {
                title: 'AI STUDY ROOM',
                desc: 'Split-screen workspace uniting the document viewer and contextual AI study terminal.',
                icon: 'terminal' as PixelIconName,
                color: 'yellow' as const,
                tag: 'STUDY',
              },
              {
                title: 'VISUAL PDF READER',
                desc: 'Server-side high-resolution PNG page rendering powered by PyMuPDF with responsive zoom.',
                icon: 'book' as PixelIconName,
                color: 'cyan' as const,
                tag: 'READER',
              },
              {
                title: 'TEXT MODE',
                desc: 'Inspect raw extracted document characters per page with one-click clipboard copying.',
                icon: 'document' as PixelIconName,
                color: 'coral' as const,
                tag: 'OCR',
              },
              {
                title: 'QUICK STUDY PROMPTS',
                desc: 'Instant action chips for summarizing chapters, key formulas, and exam prep checklists.',
                icon: 'zap' as PixelIconName,
                color: 'yellow' as const,
                tag: 'CHIPS',
              },
              {
                title: 'ACTIVE RECALL',
                desc: 'Auto-generated 3-question active recall quizzes generated directly from your source material.',
                icon: 'check' as PixelIconName,
                color: 'cyan' as const,
                tag: 'QUIZ',
              },
              {
                title: 'FORMULA SUPPORT',
                desc: 'Sanitized parsing handles complex STEM equations and mathematical symbols without errors.',
                icon: 'chip' as PixelIconName,
                color: 'coral' as const,
                tag: 'MATH',
              },
              {
                title: 'DOCUMENT SEARCH',
                desc: 'Semantic and lexical querying across single documents or your entire library archive.',
                icon: 'search' as PixelIconName,
                color: 'cyan' as const,
                tag: 'SEARCH',
              },
              {
                title: 'GEMINI AI',
                desc: 'Grounded intelligence powered by Google Gemini with strict anti-hallucination prompts.',
                icon: 'brain' as PixelIconName,
                color: 'yellow' as const,
                tag: 'LLM',
              },
              {
                title: 'FAISS VECTOR SEARCH',
                desc: 'High-speed cosine inner-product similarity search over thousands of document vectors.',
                icon: 'target' as PixelIconName,
                color: 'coral' as const,
                tag: 'VECTOR',
              },
            ].map((feature) => (
              <FeatureCard
                key={feature.title}
                iconName={feature.icon}
                iconColor={feature.color}
                tag={feature.tag}
                title={feature.title}
                description={feature.desc}
                variant="paper"
                hazardHeader={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          DECORATIVE SCALLOPED DIVIDER (PAPER -> DARK SPACE)
          ───────────────────────────────────────────────────────────── */}
      <PixelDivider variant="paper-to-dark" />

      {/* ─────────────────────────────────────────────────────────────
          9. FINAL CTA SECTION (DARK NAVY WITH STARS & FLOATING DOCS)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0A0E1A] text-white py-20 sm:py-28 overflow-hidden select-none">
        <StarField showMoon={false} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121829] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
            <span className="font-arcade text-[10px] text-[#00E5FF] tracking-wider uppercase">
              STUDY OS READY
            </span>
          </div>

          <h2 className="font-pixel text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase leading-tight">
            READY TO ENTER YOUR STUDY OS?
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-sans max-w-xl mx-auto leading-relaxed">
            Upload your first document and start learning from your own knowledge base.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <RetroButton
              to="/library"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              START LEARNING
            </RetroButton>

            <RetroButton
              to="/study-room"
              variant="dark"
              size="lg"
              rightIcon={<Terminal className="w-4 h-4" />}
            >
              OPEN STUDY ROOM
            </RetroButton>
          </div>

          <div className="pt-6 font-mono text-xs text-slate-400 flex items-center justify-center gap-4">
            <span>✓ No cloud data training</span>
            <span>•</span>
            <span>✓ Local FAISS indexing</span>
            <span>•</span>
            <span>✓ Page citations</span>
          </div>
        </div>
      </section>
    </div>
  );
};
