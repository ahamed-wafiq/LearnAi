import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  CheckSquare,
  Layers,
  BarChart3,
  Calendar,
  Bell,
  Menu,
  X,
  Sparkles,
  Zap,
  Settings,
  ChevronDown
} from 'lucide-react';
import { getLearningAnalytics } from '../../services/ragApi';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overallMastery, setOverallMastery] = useState<number>(83);

  useEffect(() => {
    getLearningAnalytics()
      .then((data) => {
        if (data.has_data && data.overall_mastery > 0) {
          setOverallMastery(data.overall_mastery);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Library', path: '/library', icon: BookOpen },
    { label: 'AI Study Room', path: '/study-room', icon: Brain },
    { label: 'Practice', path: '/practice', icon: CheckSquare },
    { label: 'Flashcards', path: '/flashcards', icon: Layers },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Planner', path: '/planner', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-lavender-geometric flex flex-col p-2.5 sm:p-4 md:p-6 lg:p-8 font-sans selection:bg-[#7E79D8]/30 selection:text-[#1E222A]">
      {/* Outer Dashboard Shell (Large Rounded Frame inspired by EduView) */}
      <div className="w-full max-w-[1540px] mx-auto rounded-[28px] sm:rounded-[38px] lg:rounded-[44px] shadow-2xl overflow-hidden border border-[#1E222A]/15 bg-[#1E222A] flex flex-col transition-all">
        
        {/* Charcoal Top Navigation Bar */}
        <header className="bg-[#1E222A] text-white px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between border-b border-white/5 relative z-40">
          {/* Left: EduView-style 3D Wireframe Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#7E79D8]/20 border border-[#7E79D8]/40 flex items-center justify-center text-[#B8BCF8] shadow-inner group-hover:scale-105 transition-transform">
              {/* Isometric 3D wireframe cube SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
                <line x1="12" y1="12" x2="12" y2="22" />
              </svg>
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                LearnSphere
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide block -mt-0.5">
                AI Study Platform
              </span>
            </div>
          </Link>

          {/* Center: Floating Pill Navigation Bar (Desktop) */}
          <nav className="hidden lg:flex items-center bg-[#292D37] p-1.5 rounded-full border border-white/5 shadow-inner">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#B8BCF8]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: User Profile, Progress Pill, Notifications */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* User Greeting & Progress Pill */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-white leading-tight">
                Hello, Mohideen
              </span>
              <span className="text-[11px] text-[#B8BCF8] font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#F99F5B] fill-[#F99F5B]" />
                Progress: {overallMastery}%
              </span>
            </div>

            {/* Avatar Pill */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F99F5B] text-[#1E222A] flex items-center justify-center font-extrabold text-xs sm:text-sm border-2 border-white/20 shadow-md">
              MA
            </div>

            {/* Notification Bell */}
            <button
              className="w-9 h-9 rounded-full bg-[#292D37] hover:bg-[#343946] border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#F99F5B] absolute top-2 right-2 ring-2 ring-[#1E222A]" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#292D37] text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1E222A] px-4 py-3 border-b border-white/10 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#B8BCF8]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Clean White/Light-Gray Content Canvas inside the Dashboard Shell */}
        <div className="flex-1 bg-[#F5F6FA] text-[#1E222A] min-h-[calc(100vh-140px)]">
          <main className="w-full mx-auto p-4 sm:p-6 lg:p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
