import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface RetroNavbarProps {
  className?: string;
}

export const RetroNavbar: React.FC<RetroNavbarProps> = ({ className = '' }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'LIBRARY', path: '/library' },
    { label: 'AI STUDY ROOM', path: '/study-room' },
    { label: 'QUIZ', path: '/practice' },
    { label: 'PROGRESS', path: '/dashboard' },
    { label: 'ABOUT', path: '/#about' },
  ];

  return (
    <header className={`w-full bg-[#070B14] pt-2 sm:pt-3 pb-1 sm:pb-2 px-3 sm:px-6 select-none ${className}`}>
      {/* ─────────────────────────────────────────────────────────────
          COMPACT HORIZONTAL RETRO NAVIGATION FRAME (Matching Reference)
          Enclosed rectangular box with thin coral border & dark panels
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto border-2 border-[#FF4742] bg-[#0D1424] shadow-[3px_3px_0px_#000] flex items-center justify-between p-1 sm:p-1.5 gap-2">
        {/* Left: Compact LearnSphere Pixel Logo Box */}
        <Link
          to="/"
          className="flex items-center gap-2 px-2 py-1 bg-[#151F36] border border-[#FF4742]/60 hover:bg-[#1A2642] transition-colors shrink-0"
        >
          <span className="bg-[#FF4742] text-white px-1.5 py-0.5 font-arcade text-[10px] tracking-tighter">
            AI
          </span>
          <div className="flex flex-col">
            <span className="font-pixel text-xs sm:text-sm font-bold tracking-wider text-white leading-none">
              LEARN AI
            </span>
            <span className="font-arcade text-[7px] sm:text-[8px] text-[#00E5FF] tracking-widest uppercase mt-0.5">
              AI STUDY OS // V2.0
            </span>
          </div>
        </Link>

        {/* Center: Desktop Retro Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
          {navLinks.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path.replace('/#', ''));

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`px-2.5 py-1 font-arcade text-[9px] lg:text-[10px] tracking-wider uppercase transition-colors border ${
                  isActive
                    ? 'bg-[#FF4742] text-white border-[#FF4742]'
                    : 'bg-[#101728] text-slate-300 border-[#1A253E] hover:text-[#00E5FF] hover:border-[#00E5FF]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Enter Study OS CTA + Mobile Hamburger */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/study-room"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-[#00E5FF] hover:bg-[#33ECFF] text-[#070B14] font-arcade text-[9px] lg:text-[10px] font-bold border border-[#00E5FF] shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <span>ENTER STUDY OS</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 bg-[#101728] text-white border border-[#FF4742] hover:text-[#00E5FF]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 border-2 border-[#FF4742] bg-[#0D1424] p-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path.replace('/#', ''));

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 font-arcade text-[9px] uppercase tracking-wider text-center border ${
                    isActive
                      ? 'bg-[#FF4742] text-white border-[#FF4742]'
                      : 'bg-[#101728] text-slate-300 border-[#1A253E] hover:text-[#00E5FF]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-1">
            <Link
              to="/study-room"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#00E5FF] text-[#070B14] font-arcade text-[10px] font-bold border border-[#00E5FF]"
            >
              <span>ENTER STUDY OS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
