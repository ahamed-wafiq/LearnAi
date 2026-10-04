import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Plus,
  Zap,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  title = 'Dashboard',
  subtitle = 'Welcome back, Mohideen! Ready to accelerate your learning?'
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const mockNotifications = [
    {
      id: 1,
      title: 'Spaced Repetition Due',
      desc: '12 flashcards in "Transformer Architecture" ready for review',
      time: '10m ago',
      unread: true,
      path: '/flashcards'
    },
    {
      id: 2,
      title: 'Weak Topic Alert',
      desc: 'Taylor Rule calculations accuracy dropped below 40%',
      time: '2h ago',
      unread: true,
      path: '/practice'
    },
    {
      id: 3,
      title: 'Document Ready',
      desc: 'Attention Is All You Need has been fully processed & indexed',
      time: '1d ago',
      unread: false,
      path: '/study-room'
    }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left title & mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-surface-light lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden md:block text-xs text-slate-400 truncate max-w-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Middle & Right action controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search concepts, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/library?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="w-full bg-surface-subtle/80 border border-surface-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* AI Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-[11px] font-medium text-primary-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent-cyan" /> Neural Synthesis Active
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-surface-light border border-transparent hover:border-surface-border relative transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-cyan ring-2 ring-surface" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-dropdown p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <Badge variant="cyan" size="sm">2 New</Badge>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-primary-400 hover:text-primary-300"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(n.path);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      n.unread
                        ? 'bg-primary-500/10 border-primary-500/25 hover:bg-primary-500/15'
                        : 'bg-surface-light/40 border-surface-border hover:bg-surface-light'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-surface text-primary-400 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Study Action Button */}
        <Button
          variant="glow"
          size="sm"
          onClick={() => navigate('/study-room')}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex"
        >
          Study Room
        </Button>
      </div>
    </header>
  );
};
