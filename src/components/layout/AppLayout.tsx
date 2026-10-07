import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  Terminal,
  BookOpen,
  Brain,
  CheckSquare,
  BarChart3,
  Calendar,
  Layers,
  Settings,
  Zap,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react';
import { RetroNavbar } from '../retro/RetroNavbar';
import { RetroFooter } from '../retro/RetroFooter';
import { RetroBadge } from '../retro/RetroBadge';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const appNavItems = [
    { label: 'CONTROL CENTER', path: '/dashboard', icon: BarChart3 },
    { label: 'KNOWLEDGE ARCHIVE', path: '/library', icon: FolderOpen },
    { label: 'AI STUDY ROOM', path: '/study-room', icon: Brain },
    { label: 'ACTIVE RECALL', path: '/practice', icon: CheckSquare },
    { label: 'FLASHCARDS', path: '/flashcards', icon: Layers },
    { label: 'STUDY PLANNER', path: '/planner', icon: Calendar },
    { label: 'SETTINGS', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex flex-col font-sans selection:bg-[#FF4742] selection:text-white">
      {/* 4. Retro Navigation Bar */}
      <RetroNavbar />

      {/* Secondary Quick-Toolbar when inside App Routes (Library, Study Room, Dashboard, etc.) */}
      {!isHomePage && (
        <div className="bg-[#121829] border-b-2 border-[#0C1220] px-4 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Quick System breadcrumbs / Module label */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-[#00E5FF] rounded-none animate-pulse" />
              <span className="font-arcade text-[10px] text-slate-300 uppercase tracking-wider">
                STUDY OS //{' '}
                <span className="text-[#FF4742]">
                  {location.pathname.replace('/', '').toUpperCase() || 'WORKSPACE'}
                </span>
              </span>
            </div>

            {/* Sub-navigation links */}
            <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-[10px] font-arcade">
              {appNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#FF4742] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]'
                        : 'bg-[#0A0E1A] text-slate-300 border-[#1E293B] hover:text-[#00E5FF] hover:border-[#00E5FF]/40'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* 10. Global Retro Footer */}
      <RetroFooter />
    </div>
  );
};
