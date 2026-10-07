import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Terminal, BookOpen, Brain, CheckSquare, BarChart3, HelpCircle } from 'lucide-react';
import { RetroButton } from './RetroButton';

interface RetroNavbarProps {
  className?: string;
}

export const RetroNavbar: React.FC<RetroNavbarProps> = ({ className = '' }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'HOME', path: '/', icon: Terminal },
    { label: 'LIBRARY', path: '/library', icon: BookOpen },
    { label: 'AI STUDY ROOM', path: '/study-room', icon: Brain },
    { label: 'QUIZ', path: '/practice', icon: CheckSquare },
    { label: 'PROGRESS', path: '/dashboard', icon: BarChart3 },
    { label: 'ABOUT', path: '/#about', icon: HelpCircle },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-[#0A0E1A]/95 backdrop-blur-md border-b-2 border-[#FF4742] shadow-[0_4px_20px_rgba(10,14,26,0.8)] ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: LEARNSPHERE Logo with Retro Coral Badge */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none"
        >
          {/* Retro Pixel Logo Badge (Inspired by reference top-left badge) */}
          <div className="bg-[#FF4742] text-white px-2 sm:px-2.5 py-1 sm:py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center font-arcade text-xs sm:text-sm tracking-tighter group-hover:bg-[#FF5F5B] transition-colors">
            LS
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-base sm:text-xl font-bold tracking-wider text-white group-hover:text-[#00E5FF] transition-colors">
              LEARNSPHERE
            </span>
            <span className="font-arcade text-[8px] sm:text-[9px] text-[#00E5FF] tracking-widest uppercase -mt-0.5">
              STUDY OS // v2.0
            </span>
          </div>
        </Link>

        {/* Center: Desktop Retro Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-[#121829] px-2 py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#000]">
          {navLinks.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path.replace('/#', ''));

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`px-3 py-1.5 font-arcade text-[10px] xl:text-[11px] uppercase tracking-wider transition-all select-none border ${
                  isActive
                    ? 'bg-[#FF4742] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]'
                    : 'text-slate-300 border-transparent hover:text-[#00E5FF] hover:bg-[#1A2338] hover:border-[#00E5FF]/40'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Enter Study OS CTA + Mobile Menu Button */}
        <div className="flex items-center gap-3 shrink-0">
          <RetroButton
            to="/study-room"
            variant="cyan"
            size="sm"
            className="hidden sm:inline-flex text-[10px] sm:text-xs"
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            ENTER STUDY OS
          </RetroButton>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 bg-[#121829] text-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] hover:text-[#00E5FF] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0E1A] border-t-2 border-[#FF4742] px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path.replace('/#', ''));
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2.5 font-arcade text-[10px] uppercase tracking-wider flex items-center gap-2 border ${
                    isActive
                      ? 'bg-[#FF4742] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]'
                      : 'bg-[#121829] text-slate-300 border-[#1E293B] hover:text-[#00E5FF]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2">
            <RetroButton
              to="/study-room"
              variant="cyan"
              size="md"
              fullWidth
              onClick={() => setMobileMenuOpen(false)}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              ENTER STUDY OS
            </RetroButton>
          </div>
        </div>
      )}
    </header>
  );
};
