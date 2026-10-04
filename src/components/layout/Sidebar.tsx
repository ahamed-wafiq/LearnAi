import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  CheckSquare,
  Layers,
  BarChart3,
  Calendar,
  Flame,
  PlusCircle,
  HardDrive,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Library', path: '/library', icon: BookOpen },
  { name: 'AI Study Room', path: '/study-room', icon: Sparkles, badge: 'AI' },
  { name: 'Practice & Quizzes', path: '/practice', icon: CheckSquare },
  { name: 'Flashcards', path: '/flashcards', icon: Layers },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Study Planner', path: '/planner', icon: Calendar },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-surface-border">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-cyan flex items-center justify-center shadow-glow-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
                Learn<span className="text-primary-400">Sphere</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block -mt-0.5">
                AI Study OS
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-light lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Study Streak Badge */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-primary-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">14-Day Streak</div>
              <div className="text-[11px] text-amber-400/90 font-medium">Keep it up today!</div>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            🔥 14
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Navigation
          </div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary-600/15 text-primary-300 border border-primary-500/30 font-semibold shadow-sm shadow-primary-950'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surface-light hover:border hover:border-surface-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary-500 to-accent-blue text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 pb-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Subjects</span>
              <NavLink to="/library" className="text-primary-400 hover:text-primary-300">
                <PlusCircle className="w-3.5 h-3.5" />
              </NavLink>
            </div>
            <div className="space-y-1 mt-1">
              <NavLink
                to="/study-room?doc=doc-1"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-surface-light transition-colors group"
              >
                <span className="w-2 h-2 rounded-full bg-primary-500 group-hover:scale-125 transition-transform" />
                <span className="truncate">Machine Learning & AI</span>
              </NavLink>
              <NavLink
                to="/study-room?doc=doc-2"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-surface-light transition-colors group"
              >
                <span className="w-2 h-2 rounded-full bg-accent-blue group-hover:scale-125 transition-transform" />
                <span className="truncate">Distributed Systems</span>
              </NavLink>
              <NavLink
                to="/study-room?doc=doc-3"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-surface-light transition-colors group"
              >
                <span className="w-2 h-2 rounded-full bg-accent-cyan group-hover:scale-125 transition-transform" />
                <span className="truncate">Cognitive Neuroscience</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Storage Bar & Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-subtle/50">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-primary-400" /> Storage
              </span>
              <span className="text-slate-300 font-medium">15.4 / 50 MB</span>
            </div>
            <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan rounded-full w-[31%]" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-white/20">
              MK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Mohideen A.</p>
              <p className="text-[11px] text-slate-400 truncate">Pro Scholar Tier</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
