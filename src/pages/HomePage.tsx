import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { HeroPixelScene } from '../components/retro/HeroPixelScene';
import { PixelDivider } from '../components/retro/PixelDivider';
import { CardPixelArt } from '../components/retro/CardPixelArt';
import { RetroButton } from '../components/retro/RetroButton';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col selection:bg-[#FF4742] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. THE HERO IS AN ILLUSTRATED SCENE (35–40% VIEWPORT HEIGHT)
          NO giant centered text! NO marketing quote! NO big hero CTAs!
          The pixel-art study laboratory in space is the primary hero!
          ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full bg-[#070B14] pt-1 sm:pt-2 overflow-hidden">
        <HeroPixelScene />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. DECORATIVE SCALLOPED DIVIDER (DARK SPACE -> WARM CREAM PAPER)
          Transitions directly from the floor of the hero into the paper section!
          ───────────────────────────────────────────────────────────── */}
      <PixelDivider variant="dark-to-paper" />

      {/* ─────────────────────────────────────────────────────────────
          3. WARM CREAM / PAPER CONTENT SECTION (MATCHING REFERENCE)
          Large parchment canvas with dark navy text, thin dark borders,
          and compact editorial cards.
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#FBF5E6] text-[#0C1220] py-10 sm:py-16 paper-dot-grid border-b-2 border-[#0C1220]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          {/* ═══════════════════════════════════════════════════════════
              SECTION 7: INTRODUCTION SECTION (MATCHING REFERENCE HEADER)
              Small coral label + Large Pixel Heading + Normal paragraph
              ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-3 max-w-4xl">
            {/* Small Coral Category Label (As seen above 'THE SCCALIN' in reference) */}
            <div className="inline-block">
              <span className="font-arcade text-[10px] sm:text-[11px] text-[#FF4742] tracking-wider uppercase font-bold">
                AI STUDY OS
              </span>
            </div>

            {/* Large Pixel Heading */}
            <h1 className="font-pixel text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase text-[#0C1220] leading-tight tracking-tight">
              TURN YOUR STUDY MATERIALS INTO AN INTELLIGENT LEARNING SPACE
            </h1>

            {/* Clean Readable Sans-Serif Paragraph */}
            <p className="font-sans text-xs sm:text-sm text-[#384357] leading-relaxed max-w-3xl pt-1">
              Learn AI turns textbooks, lecture slides and research papers into an intelligent searchable knowledge base.
              Ask questions and receive grounded answers connected directly to source pages with zero hallucinations.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 8: 3 FEATURE CARDS (REFERENCE STYLE COMPACT PANELS)
              Square corners, cream bg, thin borders, pixel art illustrations
              ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-start">
            {/* Card 1: KNOWLEDGE ARCHIVE (Matching Left Landscape in Reference) */}
            <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col overflow-hidden pixel-hover">
              {/* Category label */}
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="font-arcade text-[9px] text-[#FF4742] font-bold uppercase">
                  DOCUMENT
                </span>
                <span className="font-arcade text-[8px] text-slate-400">01</span>
              </div>

              {/* Title */}
              <div className="px-3 pb-2">
                <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220] tracking-wide">
                  KNOWLEDGE ARCHIVE
                </h3>
              </div>

              {/* Pixel Art Illustration (Landscape monitor like in reference) */}
              <div className="px-3 pb-2">
                <CardPixelArt type="library" className="h-32 bg-[#10242E]" />
              </div>

              {/* Compact Description & Link */}
              <div className="p-3 pt-1 flex-1 flex flex-col justify-between space-y-3">
                <p className="font-sans text-[11px] text-[#475569] leading-relaxed">
                  Upload textbooks, lecture slides and research papers with automated metadata extraction.
                </p>

                <Link
                  to="/library"
                  className="self-start inline-flex items-center gap-1 px-2.5 py-1 bg-[#0C1220] hover:bg-[#FF4742] text-white font-arcade text-[8px] uppercase tracking-wider transition-colors"
                >
                  <span>OPEN ARCHIVE</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: AI STUDY ROOM (Matching Center Starry Screen in Reference) */}
            <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col overflow-hidden pixel-hover">
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="font-arcade text-[9px] text-[#FF4742] font-bold uppercase">
                  STUDY
                </span>
                <span className="font-arcade text-[8px] text-slate-400">02</span>
              </div>

              <div className="px-3 pb-2">
                <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220] tracking-wide">
                  AI STUDY ROOM
                </h3>
              </div>

              <div className="px-3 pb-2">
                <CardPixelArt type="study-room" className="h-32 bg-[#070B14]" />
              </div>

              <div className="p-3 pt-1 flex-1 flex flex-col justify-between space-y-3">
                <p className="font-sans text-[11px] text-[#475569] leading-relaxed">
                  Read original PDF pages while chatting with a local RAG Copilot grounded strictly in your text.
                </p>

                <Link
                  to="/study-room"
                  className="self-start inline-flex items-center gap-1 px-2.5 py-1 bg-[#0C1220] hover:bg-[#FF4742] text-white font-arcade text-[8px] uppercase tracking-wider transition-colors"
                >
                  <span>ENTER ROOM</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: PAGE CITATIONS (Matching Right Mechanical Apparatus in Reference) */}
            <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col overflow-hidden pixel-hover">
              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <span className="font-arcade text-[9px] text-[#00E5FF] font-bold uppercase">
                  VERIFY
                </span>
                <span className="font-arcade text-[8px] text-slate-400">03</span>
              </div>

              <div className="px-3 pb-2">
                <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220] tracking-wide">
                  PAGE CITATIONS
                </h3>
              </div>

              <div className="px-3 pb-2">
                <CardPixelArt type="citations" className="h-32 bg-[#FFFDF7]" />
              </div>

              <div className="p-3 pt-1 flex-1 flex flex-col justify-between space-y-3">
                <p className="font-sans text-[11px] text-[#475569] leading-relaxed">
                  Every AI response provides page-level citations. Click any citation to jump straight to the source page.
                </p>

                <Link
                  to="/study-room"
                  className="self-start inline-flex items-center gap-1 px-2.5 py-1 bg-[#0C1220] hover:bg-[#00E5FF] hover:text-[#0C1220] text-white font-arcade text-[8px] uppercase tracking-wider transition-colors"
                >
                  <span>SEE CITATIONS</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 10: HORIZONTAL DIVIDER (Exact Reference Divider Line)
              ═══════════════════════════════════════════════════════════ */}
          <div className="w-full border-t-2 border-[#0C1220]/25 pt-2" />

          {/* ═══════════════════════════════════════════════════════════
              SECTION 9: FEATURE GRID — "YOUR AI STUDY TOOLKIT"
              Matching the second card cluster in the reference image
              ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="font-arcade text-[10px] text-[#FF4742] font-bold uppercase">
                INTELLIGENCE SUITE
              </span>
              <h2 className="font-pixel text-lg sm:text-2xl font-bold uppercase text-[#0C1220] tracking-tight">
                YOUR AI STUDY TOOLKIT
              </h2>
            </div>

            {/* 6 Compact Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
              {/* Feature 1: LOCAL RAG */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="rag" className="h-28 bg-[#070B14]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  LOCAL RAG
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  100% private document extraction, chunking, and FAISS vector indexing.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#00E5FF] font-arcade text-[8px]">
                    ZERO LEAKS
                  </span>
                  <Link
                    to="/study-room"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>EXPLORE</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 2: PDF READER */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="reader" className="h-28 bg-[#122E3A]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  PDF READER
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  High-fidelity PyMuPDF visual page PNG render with text OCR inspection.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#FF4742] font-arcade text-[8px]">
                    DUAL MODE
                  </span>
                  <Link
                    to="/library"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>OPEN PDF</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 3: PAGE CITATIONS */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="citations" className="h-28 bg-[#FFFDF7]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  PAGE CITATIONS
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  Direct citation anchor chips that jump the viewer to the exact cited page.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#F8C02F] font-arcade text-[8px]">
                    VERIFIABLE
                  </span>
                  <Link
                    to="/study-room"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>VERIFY</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 4: ACTIVE RECALL */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="recall" className="h-28 bg-[#070B14]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  ACTIVE RECALL
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  Predicts memory decay intervals to optimize spaced repetition flashcards.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#39FF14] font-arcade text-[8px]">
                    SPACED REP
                  </span>
                  <Link
                    to="/practice"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>PRACTICE</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 5: FORMULA SUPPORT */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="formula" className="h-28 bg-[#051A0E]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  FORMULA SUPPORT
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  Sanitized STEM equation parsing handles gradients and math symbols.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#00E5FF] font-arcade text-[8px]">
                    LaTeX MATH
                  </span>
                  <Link
                    to="/study-room"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>TEST MATH</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 6: AI QUIZ */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-3 flex flex-col space-y-2 pixel-hover">
                <CardPixelArt type="quiz" className="h-28 bg-[#070B14]" />
                <h4 className="font-pixel text-xs font-bold uppercase text-[#0C1220]">
                  AI QUIZ
                </h4>
                <p className="font-sans text-[11px] text-[#475569] leading-snug">
                  Auto-generated active recall quizzes extracted directly from study PDFs.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 bg-[#0C1220] text-[#FF4742] font-arcade text-[8px]">
                    ASSESSMENT
                  </span>
                  <Link
                    to="/practice"
                    className="inline-flex items-center gap-1 text-[8px] font-arcade text-[#0C1220] hover:text-[#FF4742] uppercase font-bold"
                  >
                    <span>TAKE QUIZ</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DECORATIVE SCALLOPED DIVIDER (PAPER -> DARK SPACE)
          ───────────────────────────────────────────────────────────── */}
      <PixelDivider variant="paper-to-dark" />

      {/* ─────────────────────────────────────────────────────────────
          5. FINAL CTA SECTION (COMPACT DARK SPACE SECTION)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#070B14] text-white py-12 sm:py-16 select-none border-b-2 border-[#0C1220]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <span className="font-arcade text-[9px] text-[#00E5FF] uppercase tracking-widest">
            // STUDY OS READY //
          </span>

          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            READY TO ENTER YOUR STUDY OS?
          </h2>

          <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Upload your first document and start learning from your own knowledge base.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <RetroButton to="/library" variant="primary" size="md">
              START LEARNING
            </RetroButton>
            <RetroButton to="/study-room" variant="cyan" size="md">
              ENTER STUDY OS
            </RetroButton>
          </div>
        </div>
      </section>
    </div>
  );
};
