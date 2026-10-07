import React, { useState, useEffect } from 'react';
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
import { getLearningAnalytics, listDocuments, getPlannerOverview } from '../../services/ragApi';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

interface NotificationItem {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  path: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  title = 'Dashboard',
  subtitle = 'Welcome back, Mohideen! Ready to accelerate your learning?'
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const [analytics, docs, planner] = await Promise.all([
          getLearningAnalytics().catch(() => null),
          listDocuments().catch(() => []),
          getPlannerOverview().catch(() => null)
        ]);

        if (!isMounted) return;
        const items: NotificationItem[] = [];

        // 1. Spaced Repetition Due
        if (analytics?.spaced_repetition?.due_today_count && analytics.spaced_repetition.due_today_count > 0) {
          items.push({
            id: 'sr-due',
            title: 'Spaced Repetition Due',
            desc: `${analytics.spaced_repetition.due_today_count} flashcards ready for active recall review`,
            time: 'Today',
            unread: true,
            path: '/flashcards'
          });
        }

        // 2. Weak Topic Alert
        if (analytics?.weak_topics && analytics.weak_topics.length > 0) {
          const topWeak = analytics.weak_topics[0];
          items.push({
            id: 'weak-alert',
            title: 'Weak Topic Alert',
            desc: `${topWeak.topic}: ${topWeak.reason}`,
            time: 'Active',
            unread: true,
            path: '/practice'
          });
        }

        // 3. Today's Study Tasks
        const pendingTasks = planner?.today_tasks?.filter((t) => t.status === 'scheduled') || [];
        if (pendingTasks.length > 0) {
          items.push({
            id: 'plan-due',
            title: 'Scheduled Tasks Pending',
            desc: `${pendingTasks.length} study session${pendingTasks.length > 1 ? 's' : ''} scheduled for today`,
            time: 'Today',
            unread: true,
            path: '/planner'
          });
        }

        // 4. Latest Document Ready
        if (docs.length > 0) {
          const latestDoc = docs[0];
          items.push({
            id: `doc-${latestDoc.id}`,
            title: 'Document Indexed',
            desc: `"${latestDoc.filename}" (${latestDoc.total_pages} pages, ${latestDoc.chunks_count} chunks) ready for AI Q&A`,
            time: latestDoc.upload_time ? latestDoc.upload_time.split(' ')[0] : 'Ready',
            unread: false,
            path: `/study-room?doc=${latestDoc.id}`
          });
        }

        if (items.length === 0) {
          items.push({
            id: 'welcome-notif',
            title: 'Welcome to LearnSphere',
            desc: 'Upload course documents in your Library to begin personalized learning.',
            time: 'Now',
            unread: false,
            path: '/library'
          });
        }

        setNotifications(items);
        setUnreadCount(items.filter((n) => n.unread).length);
      } catch {
        // Fallback
      }
    };

    fetchNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

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
                  {unreadCount > 0 ? (
                    <Badge variant="cyan" size="sm">{unreadCount} New</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Caught Up</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary-400 hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
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
