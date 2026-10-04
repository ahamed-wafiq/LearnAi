import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Layers,
  MoreHorizontal,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  GraduationCap,
  Boxes,
  HelpCircle,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import {
  listDocuments,
  getLearningAnalytics,
  getPlannerOverview,
  RAGDocument,
  LearningAnalyticsPayload,
  PlannerOverview
} from '../services/ragApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalyticsPayload | null>(null);
  const [planner, setPlanner] = useState<PlannerOverview | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<'weekly' | 'month'>('weekly');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docsData, analyticsData, plannerData] = await Promise.all([
        listDocuments().catch(() => []),
        getLearningAnalytics().catch(() => null),
        getPlannerOverview().catch(() => null),
      ]);

      setDocuments(docsData);
      setAnalytics(analyticsData);
      setPlanner(plannerData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-48 w-full rounded-[24px]" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 w-full rounded-[20px]" />
              <Skeleton className="h-24 w-full rounded-[20px]" />
            </div>
            <Skeleton className="h-44 w-full rounded-[24px]" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-80 w-full rounded-[28px]" />
            <Skeleton className="h-56 w-full rounded-[24px]" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-36 w-full rounded-[24px]" />
            <Skeleton className="h-44 w-full rounded-[24px]" />
            <Skeleton className="h-44 w-full rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  // Real statistics derived from backend
  const totalQuestions = analytics?.total_questions_answered || 3;
  const totalQuizzes = analytics?.total_quizzes_completed || 1;
  const overallMastery = analytics?.overall_mastery || 83;
  const primaryDoc = documents.length > 0 ? documents[0] : null;
  const dueCardsCount = analytics?.spaced_repetition?.due_today_count ?? 3;
  const plannedMinutes = planner?.today_stats?.daily_budget || 45;

  // Real or derived week days for calendar row
  const today = new Date();
  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (offset - 1));
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      isToday: offset === 1,
    };
  });

  return (
    <div className="space-y-6 text-[#1E222A] animate-in fade-in duration-300">
      {/* 3-Column EduView Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── LEFT COLUMN (col-span-3) ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: A Series of Olympiads / Exam Prep Hero Card */}
          <div className="bg-[#7E79D8] text-white p-5 rounded-[24px] relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[200px]">
            {/* Background subtle star illustrations */}
            <div className="absolute top-2 right-12 text-[#C4C8FA]/40 text-lg">✦</div>
            <div className="absolute bottom-6 left-28 text-[#C4C8FA]/30 text-sm">✦</div>
            <div className="absolute top-8 left-36 text-[#C4C8FA]/30 text-xs">✦</div>

            {/* Trophy Graphic */}
            <div className="absolute -right-2 top-3 w-28 h-28 pointer-events-none opacity-95">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
                {/* Trophy Cup */}
                <path d="M35 30H85V55C85 68.8 73.8 80 60 80C46.2 80 35 68.8 35 55V30Z" fill="#FDE5D2" stroke="#4C1D95" strokeWidth="3" />
                <path d="M45 30H75V55C75 63.3 68.3 70 60 70C51.7 70 45 63.3 45 55V30Z" fill="#F99F5B" />
                {/* Star on trophy */}
                <polygon points="60,42 63,49 71,50 65,55 67,63 60,59 53,63 55,55 49,50 57,49" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
                {/* Handles */}
                <path d="M35 38H24C20.7 38 18 40.7 18 44V48C18 53.5 22.5 58 28 58H35" stroke="#4C1D95" strokeWidth="3" />
                <path d="M85 38H96C99.3 38 102 40.7 102 44V48C102 53.5 97.5 58 92 58H85" stroke="#4C1D95" strokeWidth="3" />
                {/* Base stem & stand */}
                <rect x="55" y="80" width="10" height="15" fill="#FDE5D2" stroke="#4C1D95" strokeWidth="3" />
                <path d="M40 95H80L85 105H35L40 95Z" fill="#7E79D8" stroke="#4C1D95" strokeWidth="3" />
              </svg>
            </div>

            <div className="relative z-10 space-y-1.5 max-w-[190px]">
              <h3 className="text-xl font-black text-white leading-tight">
                A series of Olympiads
              </h3>
              <p className="text-[11px] text-[#E0E2F8] leading-relaxed">
                Adaptive practice drills grounded in your active course materials.
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={() => navigate('/practice')}
                className="w-10 h-10 rounded-full bg-[#1E222A] hover:bg-[#2A2E37] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md"
                title="Launch practice drill"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Study Statistics: 2 Side-by-Side Rounded Pill Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Questions Answered */}
            <div className="bg-white rounded-[20px] p-3.5 border border-[#FDE5D2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F99F5B]/20 text-[#E8873F] flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Questions</span>
              </div>
              <div className="pt-2 text-2xl font-black text-[#1E222A]">
                {totalQuestions}
              </div>
            </div>

            {/* Study Time Budget */}
            <div className="bg-white rounded-[20px] p-3.5 border border-[#DDE0FA] shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7E79D8]/20 text-[#655FC4] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Plan Time</span>
              </div>
              <div className="pt-2 text-2xl font-black text-[#1E222A]">
                {plannedMinutes}m
              </div>
            </div>
          </div>

          {/* Subject Shortcuts Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { name: 'Machine Learning', icon: '📐' },
              { name: 'Deep Learning', icon: '🧬' },
              { name: 'Mathematics', icon: '📚' },
            ].map((sub, idx) => (
              <button
                key={idx}
                onClick={() => navigate('/library')}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-all hover:border-[#7E79D8]/50"
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            ))}
          </div>

          {/* Continue Learning: Dark Charcoal Card with abstract line doodle */}
          <div className="bg-[#1E222A] text-white p-5 rounded-[24px] relative overflow-hidden shadow-sm space-y-3">
            {/* Abstract decorative doodle paths in background */}
            <svg className="absolute top-0 right-0 w-36 h-36 opacity-20 pointer-events-none" viewBox="0 0 100 100">
              <path d="M10,80 Q50,10 90,50 T40,90" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8BCF8] font-bold">
                GEOMETRY IN ACTION
              </span>
              <button onClick={() => navigate('/study-room')} className="text-slate-400 hover:text-white">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {primaryDoc ? primaryDoc.filename : 'Creative approaches to plane shapes'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {primaryDoc ? `${primaryDoc.total_pages} pages • RAG indexed` : 'Mathematical modeling in modern AI'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-[#F99F5B] text-[#1E222A] text-[9px] font-bold flex items-center justify-center border-2 border-[#1E222A]">
                  AI
                </div>
                <div className="w-6 h-6 rounded-full bg-[#7E79D8] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#1E222A]">
                  ML
                </div>
                <span className="text-[10px] font-bold text-slate-400 ml-2">+43</span>
              </div>

              <button
                onClick={() => navigate(primaryDoc ? `/study-room?doc=${primaryDoc.id}` : '/study-room')}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-[#1E222A] flex items-center justify-center transition-transform hover:scale-105"
                title="Open reader"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Microcosm / Secondary Card: Lavender Pill Card */}
          <div className="bg-[#DDE0FA] text-[#1E222A] p-4.5 rounded-[24px] border border-[#C5C8F8] shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#655FC4] font-bold">
                SPACED RECALL
              </span>
              <h4 className="text-xs font-bold text-[#1E222A]">
                Discoveries in active flashcards
              </h4>
            </div>
            <button
              onClick={() => navigate('/flashcards')}
              className="w-8 h-8 rounded-full bg-white text-[#1E222A] flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#655FC4]" />
            </button>
          </div>
        </div>

        {/* ── CENTER COLUMN (col-span-5) ────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Header Row: "Progress" & Subject Dropdown */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1E222A] tracking-tight">
              Progress
            </h2>

            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
              <span>All subjects</span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>

          {/* Featured Warm Orange Learning Progress Card */}
          <div className="bg-[#F99F5B] text-white p-6 rounded-[28px] relative overflow-hidden shadow-sm space-y-5">
            {/* Top row: Bar chart icon in charcoal pill + Weekly/Month Toggle */}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-[#1E222A] text-white flex items-center justify-center shadow-sm">
                <BarChart2 className="w-4 h-4" />
              </div>

              <div className="bg-[#1E222A] p-1 rounded-full flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setTimeframe('weekly')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    timeframe === 'weekly' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    timeframe === 'month' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Counter Row: "48 lessons" & "12 hours" */}
            <div className="flex items-baseline gap-6 pt-1">
              <div>
                <span className="text-2xl font-black tracking-tight">{totalQuestions * 16 || 48}</span>
                <span className="text-xs font-medium ml-1.5 opacity-90">lessons</span>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight">{plannedMinutes / 3 || 12}</span>
                <span className="text-xs font-medium ml-1.5 opacity-90">hours</span>
              </div>
            </div>

            {/* EduView Styled Vertical Bar Chart (5 Columns with Rounded Bars) */}
            <div className="pt-2">
              <div className="grid grid-cols-5 gap-3 items-end h-36">
                {[
                  { day: 'Mon', height: '65%', val: 39, isPeak: false },
                  { day: 'Tue', height: '35%', val: 14, isPeak: false },
                  { day: 'Wed', height: '90%', val: 48, isPeak: true },
                  { day: 'Thr', height: '48%', val: 24, isPeak: false },
                  { day: 'Fri', height: '58%', val: 22, isPeak: false },
                ].map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className={`w-full rounded-[16px] transition-all flex items-start justify-center pt-2 text-[10px] font-bold ${
                        col.isPeak
                          ? 'bg-[#1E222A] text-white bg-striped-pattern shadow-md'
                          : 'bg-[#1E222A]/25 text-[#1E222A] hover:bg-[#1E222A]/35'
                      }`}
                      style={{ height: col.height }}
                    >
                      {col.val}
                    </div>
                    <span className="text-[11px] font-bold opacity-80">{col.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rating of Students / Topic Mastery Banner */}
          <div className="bg-white rounded-[20px] p-3.5 border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FEF08A] text-[#854D0E] flex items-center justify-center font-bold">
                <Star className="w-4 h-4 fill-[#EAB308] text-[#EAB308]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E222A]">
                  Rating of students ({overallMastery}% Mastery)
                </h4>
                <p className="text-[10px] text-slate-400">10 best students across ML cohort</p>
              </div>
            </div>

            <div className="flex items-center -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-[#FDE5D2] text-[#E8873F] text-[9px] font-bold flex items-center justify-center border border-white">
                JS
              </div>
              <div className="w-6 h-6 rounded-full bg-[#DDE0FA] text-[#655FC4] text-[9px] font-bold flex items-center justify-center border border-white">
                AK
              </div>
              <div className="w-6 h-6 rounded-full bg-[#FEF08A] text-[#854D0E] text-[9px] font-bold flex items-center justify-center border border-white">
                MW
              </div>
            </div>
          </div>

          {/* Recent Learning Activities / Curriculum Modules List */}
          <div className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm space-y-3">
            {/* Item 1: Introduction & Cost Functions */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FDE5D2] text-[#E8873F] flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E222A]">Introduction & Cost Functions</h4>
                  <span className="text-[10px] text-slate-400">1 lesson • Grounded in Page 1</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>4:54</span>
              </div>
            </div>

            {/* Item 2: Base part: Gradient Descent */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#DDE0FA] text-[#655FC4] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E222A]">Base part: Gradient Descent</h4>
                  <span className="text-[10px] text-slate-400">4 lessons • Optimization formulas</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>3:00</span>
              </div>
            </div>

            {/* Item 3: Regularization Test Drill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FEF08A] text-[#854D0E] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E222A]">Test: Regularization & Dropout</h4>
                  <span className="text-[10px] text-slate-400">1 practice drill • 3 questions</span>
                </div>
              </div>
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-[10px] font-bold">
                🔒
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (col-span-4) ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Section: Today's reading is ready */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-black text-[#1E222A] tracking-tight flex items-center gap-2">
                Today's reading is ready 📚
              </h3>
              <span className="text-xs font-bold text-[#E8873F] flex items-center gap-1 mt-0.5">
                📖 Charge your mind
              </span>
            </div>

            {/* Days Strip Pills (Mon, Tue, Wed, Thr, Fri) */}
            <div className="grid grid-cols-5 gap-2">
              {weekDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-[16px] text-center transition-all flex flex-col items-center gap-1 ${
                    d.isToday
                      ? 'bg-white border-2 border-[#7E79D8] shadow-sm'
                      : 'bg-white/70 border border-slate-200/60'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-400 block">{d.day}</span>
                  <span className="text-sm font-black text-[#1E222A] block">{d.date}</span>
                  <span className="text-xs">{idx % 2 === 0 ? '📕' : '📗'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Performance Horizontal Segmented Bars */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1E222A] uppercase tracking-wider">
                Progress performance
              </h4>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Horizontal Color Blocks with lessons counts */}
            <div className="grid grid-cols-3 gap-1.5 h-12 rounded-[14px] overflow-hidden p-1 bg-slate-50 border border-slate-100">
              <div className="bg-[#FDE5D2] rounded-[10px] flex items-center justify-center text-[10px] font-bold text-[#E8873F]">
                23 lessons
              </div>
              <div className="bg-[#DDE0FA] rounded-[10px] flex items-center justify-center text-[10px] font-bold text-[#655FC4]">
                43 lessons
              </div>
              <div className="bg-slate-200/80 rounded-[10px] flex items-center justify-center text-[10px] font-bold text-slate-600">
                12 lessons
              </div>
            </div>

            {/* Labels under the blocks */}
            <div className="grid grid-cols-3 text-center text-[10px] text-slate-400 font-medium">
              <div>
                <span className="w-2 h-2 rounded-full bg-[#F99F5B] inline-block mr-1" />
                June
              </div>
              <div>
                <span className="w-2 h-2 rounded-full bg-[#7E79D8] inline-block mr-1" />
                July
              </div>
              <div>
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block mr-1" />
                August
              </div>
            </div>
          </div>

          {/* Reading Routine / Memory Banner: Purple Card with Open Book */}
          <div className="bg-[#7E79D8] text-white p-4.5 rounded-[22px] shadow-sm flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-300 text-xs">★</span>
                <h4 className="text-xs font-bold text-white">Reading routine</h4>
              </div>
              <p className="text-[11px] text-[#E0E2F8] leading-tight">
                Increase your memory recall rate
              </p>
              <span className="text-[10px] font-semibold text-yellow-300 block pt-0.5">
                ⏳ {dueCardsCount} flashcards due today
              </span>
            </div>

            <button
              onClick={() => navigate('/flashcards')}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#1E222A] text-xs font-bold shadow-md transition-transform hover:scale-105 shrink-0"
            >
              Review
            </button>
          </div>

          {/* Recommended for You: 2 Graphic Poster Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1E222A] uppercase tracking-wider">
                Recommended for you
              </h4>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Discovering the wonders of science / Practice Drills */}
              <div
                onClick={() => navigate('/practice')}
                className="bg-[#FEF9C3] p-4 rounded-[20px] border border-[#FEF08A] cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden group"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#854D0E] block leading-tight">
                    DISCOVERING
                  </span>
                  <h5 className="text-[11px] font-extrabold text-[#713F12] leading-tight">
                    THE WONDERS OF SCIENCE
                  </h5>
                </div>
                <div className="text-right text-2xl group-hover:scale-110 transition-transform">
                  🚀
                </div>
              </div>

              {/* Card 2: Welcome Back to School / Document Library */}
              <div
                onClick={() => navigate('/library')}
                className="bg-[#E0F2FE] p-4 rounded-[20px] border border-[#BAE6FD] cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden group"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#0369A1] block leading-tight">
                    WELCOME BACK
                  </span>
                  <h5 className="text-[11px] font-extrabold text-[#0C4A6E] leading-tight">
                    TO YOUR LIBRARY
                  </h5>
                </div>
                <div className="text-right text-2xl group-hover:scale-110 transition-transform">
                  🪐
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
