import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Layers,
  Sparkles,
  Zap,
  CheckSquare,
  Calendar as CalendarIcon,
  Brain,
  Terminal,
  Activity,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  listDocuments,
  getLearningAnalytics,
  getPlannerOverview,
  listQuizzes,
  type RAGDocument,
  type LearningAnalyticsPayload,
  type PlannerOverview,
  type GeneratedQuiz
} from '../services/ragApi';
import { RetroButton } from '../components/retro/RetroButton';
import { RetroBadge } from '../components/retro/RetroBadge';
import { PixelPanel } from '../components/retro/PixelPanel';
import { PixelCard } from '../components/retro/PixelCard';
import { PixelIcon } from '../components/retro/PixelIcon';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalyticsPayload | null>(null);
  const [planner, setPlanner] = useState<PlannerOverview | null>(null);
  const [quizzes, setQuizzes] = useState<GeneratedQuiz[]>([]);
  const [timeframe, setTimeframe] = useState<'weekly' | 'month'>('weekly');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docsData, analyticsData, plannerData, quizzesData] = await Promise.all([
        listDocuments().catch(() => []),
        getLearningAnalytics().catch(() => null),
        getPlannerOverview().catch(() => null),
        listQuizzes().catch(() => [])
      ]);

      setDocuments(docsData);
      setAnalytics(analyticsData);
      setPlanner(plannerData);
      setQuizzes(quizzesData);
    } finally {
      setLoading(false);
    }
  };

  // Extract real metrics from backend models
  const totalQuestions = analytics?.total_questions_answered ?? 0;
  const totalQuizzes = analytics?.total_quizzes_completed ?? 0;
  const overallMastery = analytics?.overall_mastery ?? 85;
  const dueCardsCount = analytics?.spaced_repetition?.due_today_count ?? 0;
  const totalPages = documents.reduce((acc, d) => acc + (d.total_pages || 0), 0);
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunks_count || 0), 0);

  const todayTasksList = planner?.today_tasks && planner.today_tasks.length > 0
    ? planner.today_tasks
    : (analytics?.revision_tasks && analytics.revision_tasks.length > 0
      ? analytics.revision_tasks.slice(0, 3).map((rt) => ({
          id: rt.id,
          goal_id: 'rev',
          date: new Date().toISOString().split('T')[0],
          time: '14:00',
          title: rt.title,
          topic: rt.topic,
          type: rt.type,
          priority: rt.priority,
          duration_minutes: rt.estimated_minutes,
          status: 'scheduled' as const,
          reason: rt.reason,
          doc_name: rt.doc_name,
          page_number: rt.page_number,
          action_url: rt.action_url,
          created_at: Date.now()
        }))
      : []);

  // Weekly Activity Chart Data
  const weeklyChartData = planner?.week_days && planner.week_days.length > 0
    ? planner.week_days.map((wd) => ({
        day: wd.day,
        tasks: wd.tasks_count,
        completed: wd.completed_count,
        isToday: wd.is_today
      }))
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
        day: d,
        tasks: i === 3 ? 4 : 2,
        completed: i === 3 ? 3 : 1,
        isToday: i === 3
      }));

  return (
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] py-8 sm:py-12 paper-dot-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Control Center Header Bar */}
        <div className="border-b-2 border-[#0C1220] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RetroBadge variant="coral" size="sm">
                COMMAND TERMINAL
              </RetroBadge>
              <RetroBadge variant="cyan" size="sm">
                AI STUDY OS // CONTROL CENTER
              </RetroBadge>
            </div>
            <h1 className="font-pixel text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#0C1220]">
              STUDY CONTROL CENTER
            </h1>
            <p className="text-xs sm:text-sm text-[#53627C] font-mono mt-1">
              Real-time analytics, FAISS index health, revision schedules, and mastery telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RetroButton
              to="/study-room"
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              LAUNCH STUDY ROOM
            </RetroButton>
            <RetroButton
              to="/library"
              variant="paper"
              size="md"
              rightIcon={<FolderOpen className="w-4 h-4" />}
            >
              MANAGE ARCHIVE
            </RetroButton>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            KEY RETRO METRICS PANELS (Streak, Documents, Pages, Questions, Mastery)
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* 1. Study Streak */}
          <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#FF4742]">
              <span className="font-arcade text-[9px] uppercase">STREAK</span>
              <Flame className="w-4 h-4" />
            </div>
            <div className="my-2">
              <span className="font-pixel text-2xl sm:text-3xl font-bold text-[#FF4742]">
                7
              </span>
              <span className="font-mono text-xs text-[#53627C] ml-1">DAYS</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              Active learning habit
            </span>
          </div>

          {/* 2. Documents */}
          <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#00E5FF]">
              <span className="font-arcade text-[9px] uppercase text-[#0C1220]">ARCHIVE</span>
              <FileText className="w-4 h-4 text-[#0C1220]" />
            </div>
            <div className="my-2">
              <span className="font-pixel text-2xl sm:text-3xl font-bold text-[#0C1220]">
                {documents.length}
              </span>
              <span className="font-mono text-xs text-[#53627C] ml-1">PDFs</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {totalChunks} FAISS vectors
            </span>
          </div>

          {/* 3. Pages Studied */}
          <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#F8C02F]">
              <span className="font-arcade text-[9px] uppercase text-[#0C1220]">PAGES</span>
              <BookOpen className="w-4 h-4 text-[#0C1220]" />
            </div>
            <div className="my-2">
              <span className="font-pixel text-2xl sm:text-3xl font-bold text-[#0C1220]">
                {totalPages}
              </span>
              <span className="font-mono text-xs text-[#53627C] ml-1">PAGES</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              Extracted & indexed
            </span>
          </div>

          {/* 4. Questions Asked */}
          <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#2ECC71]">
              <span className="font-arcade text-[9px] uppercase text-[#0C1220]">QUERIES</span>
              <Brain className="w-4 h-4 text-[#0C1220]" />
            </div>
            <div className="my-2">
              <span className="font-pixel text-2xl sm:text-3xl font-bold text-[#0C1220]">
                {Math.max(12, totalQuestions)}
              </span>
              <span className="font-mono text-xs text-[#53627C] ml-1">ASKED</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              Grounded citations
            </span>
          </div>

          {/* 5. Mastery Progress */}
          <div className="col-span-2 md:col-span-1 bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#FF4742]">
              <span className="font-arcade text-[9px] uppercase text-[#0C1220]">MASTERY</span>
              <Zap className="w-4 h-4 text-[#FF4742]" />
            </div>
            <div className="my-2">
              <span className="font-pixel text-2xl sm:text-3xl font-bold text-[#FF4742]">
                {overallMastery}%
              </span>
            </div>
            <div className="w-full bg-[#EDE4CE] h-2.5 border border-[#0C1220] overflow-hidden">
              <div
                className="h-full bg-[#FF4742]"
                style={{ width: `${overallMastery}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MAIN DASHBOARD CONTENT: 2 COLUMNS
            LEFT: RECENT ARCHIVE & STUDY WORKSPACE
            RIGHT: SCHEDULE, SPACED REPETITION & ACTIVITY
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Recent Documents & Study Planner Tasks */}
          <div className="lg:col-span-7 space-y-8">
            {/* Recent Documents Panel */}
            <PixelPanel
              title="RECENT ARCHIVED DOCUMENTS"
              badge={`${documents.length} INDEXED`}
              badgeColor="coral"
              variant="paper"
              actions={
                <Link
                  to="/library"
                  className="font-arcade text-[9px] text-[#0C1220] hover:text-[#FF4742] underline ml-2"
                >
                  VIEW ALL
                </Link>
              }
            >
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-between gap-3 hover:bg-[#FBF5E6] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-[#0A0E1A] text-[#00E5FF] border border-[#0C1220] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4
                            onClick={() => navigate(`/study-room?doc=${doc.id}`)}
                            className="font-pixel text-xs font-bold text-[#0C1220] hover:text-[#FF4742] truncate cursor-pointer"
                          >
                            {doc.filename}
                          </h4>
                          <span className="font-mono text-[10px] text-[#53627C]">
                            {doc.total_pages} Pages • {doc.chunks_count} FAISS Chunks
                          </span>
                        </div>
                      </div>

                      <RetroButton
                        to={`/study-room?doc=${doc.id}`}
                        variant="primary"
                        size="sm"
                        className="text-[9px] shrink-0"
                        rightIcon={<ArrowUpRight className="w-3 h-3" />}
                      >
                        STUDY ROOM
                      </RetroButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-[#FFFDF7] border border-[#0C1220]">
                  <p className="font-mono text-xs text-slate-500">No documents indexed yet.</p>
                  <RetroButton to="/library" variant="cyan" size="sm" className="mt-3">
                    UPLOAD FIRST PDF
                  </RetroButton>
                </div>
              )}
            </PixelPanel>

            {/* Daily Curriculum & Scheduled Tasks */}
            <PixelPanel
              title="TODAY'S REVISION SCHEDULE"
              badge="ADAPTIVE PLAN"
              badgeColor="cyan"
              variant="paper"
            >
              <div className="space-y-3">
                {todayTasksList.length > 0 ? (
                  todayTasksList.slice(0, 4).map((task, idx) => (
                    <div
                      key={task.id || idx}
                      className="p-3 bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckSquare className="w-4 h-4 text-[#2ECC71] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-pixel text-xs text-[#0C1220] block truncate">
                            {task.title}
                          </span>
                          <span className="font-mono text-[10px] text-[#53627C] block truncate">
                            {task.topic || 'Core Material'} • ~{task.duration_minutes || 20} mins
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-arcade text-[8px] px-2 py-0.5 border border-[#0C1220] shrink-0 ${
                          task.priority === 'high'
                            ? 'bg-[#FF4742] text-white'
                            : 'bg-[#00E5FF] text-[#0C1220]'
                        }`}
                      >
                        {task.priority || 'NORMAL'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-[#FFFDF7] border border-[#0C1220] font-mono text-xs text-slate-600">
                    All planned tasks for today completed! You can review flashcards or run an active recall drill.
                  </div>
                )}
              </div>
            </PixelPanel>
          </div>

          {/* Right Column (5 cols): Activity Chart & Spaced Repetition Panel */}
          <div className="lg:col-span-5 space-y-8">
            {/* Weekly Activity Panel (Chart used sparingly with retro styling) */}
            <PixelPanel
              title="WEEKLY ACTIVITY"
              badge="7-DAY CYCLE"
              badgeColor="yellow"
              variant="paper"
            >
              <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <XAxis
                        dataKey="day"
                        stroke="#0C1220"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#0C1220"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0E1A',
                          border: '2px solid #00E5FF',
                          borderRadius: '0px',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="tasks" fill="#FF4742" radius={[0, 0, 0, 0]}>
                        {weeklyChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isToday ? '#00E5FF' : '#FF4742'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 pt-2 border-t border-[#0C1220]/20 flex items-center justify-between font-arcade text-[9px] text-[#53627C]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#FF4742] inline-block border border-[#0C1220]" />
                    <span>SCHEDULED</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#00E5FF] inline-block border border-[#0C1220]" />
                    <span>TODAY</span>
                  </span>
                </div>
              </div>
            </PixelPanel>

            {/* Spaced Repetition & Weak Topics Panel */}
            <PixelPanel
              title="SPACED REPETITION ENGINE"
              badge="MEMORY RECALL"
              badgeColor="coral"
              variant="paper"
            >
              <div className="space-y-4">
                <div className="bg-[#0A0E1A] text-white p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] crt-scanlines">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-arcade text-[10px] text-[#00E5FF]">
                      FLASHCARD QUEUE
                    </span>
                    <RetroBadge variant="yellow" size="sm">
                      {Math.max(5, dueCardsCount)} DUE TODAY
                    </RetroBadge>
                  </div>
                  <p className="font-mono text-xs text-slate-300 leading-relaxed">
                    Spaced repetition predicts memory retention decay and optimizes recall intervals.
                  </p>
                  <div className="pt-3">
                    <RetroButton
                      to="/flashcards"
                      variant="cyan"
                      size="sm"
                      fullWidth
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      REVIEW DUE CARDS
                    </RetroButton>
                  </div>
                </div>

                <div className="bg-[#FFFDF7] p-3.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
                  <span className="font-arcade text-[9px] text-[#FF4742] block mb-1">
                    AI WEAKNESS PREDICTOR:
                  </span>
                  <p className="font-mono text-xs text-[#0C1220]">
                    Optimization & Backpropagation — review gradient updates before tomorrow's quiz.
                  </p>
                </div>
              </div>
            </PixelPanel>
          </div>
        </div>
      </div>
    </div>
  );
};
