import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Flame,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { StudyService } from '../services/studyService';
import { Subject, StudyStreak, WeakTopic, UpcomingRevision, AnalyticsData } from '../types';
import { StatsCard } from '../components/ui/StatsCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [upcomingRevisions, setUpcomingRevisions] = useState<UpcomingRevision[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await StudyService.getDashboardOverview();
        setSubjects(data.subjects);
        setStreak(data.streak);
        setWeakTopics(data.weakTopics);
        setUpcomingRevisions(data.upcomingRevisions);
        setAnalytics(data.analytics);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome & Motivation Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-6 sm:p-8 border border-primary-500/20 shadow-glow-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-500/20 via-accent-cyan/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-xs font-semibold text-primary-300">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Personalized AI Study Flow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready for high-yield recall, <span className="gradient-text">Mohideen?</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your neural retention model recommends a quick 15-minute review on{' '}
              <strong className="text-primary-300 font-semibold">Self-Attention & Transformer Mechanics</strong>{' '}
              to optimize your memory decay curve today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="glow"
              size="lg"
              onClick={() => navigate('/study-room?doc=doc-1')}
              leftIcon={<Play className="w-4 h-4 fill-white" />}
            >
              Resume Study
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/practice')}
              leftIcon={<Zap className="w-4 h-4 text-amber-400" />}
            >
              Take Drill
            </Button>
          </div>
        </div>

        {/* Mini Streak Week Dots */}
        {streak && (
          <div className="mt-6 pt-5 border-t border-surface-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="text-xs font-semibold text-slate-300">
                Weekly Active Streak ({streak.currentStreak} Days)
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {streak.weeklyActivity.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      day.completedGoals
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-surface-light text-slate-400 border border-surface-border'
                    }`}
                  >
                    {day.completedGoals ? '✓' : day.day[0]}
                  </div>
                  <span className="text-[10px] text-slate-400">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Daily Study Time"
          value="1h 45m"
          subtitle="Target: 2h 00m"
          trend={{ value: '+18% vs last week', isPositive: true }}
          icon={Clock}
          colorVariant="violet"
        />
        <StatsCard
          title="Topic Mastery"
          value={`${analytics?.overallMastery || 76}%`}
          subtitle="5 active subjects"
          trend={{ value: '+4.2% this week', isPositive: true }}
          icon={Award}
          colorVariant="cyan"
          badge="Proficient"
        />
        <StatsCard
          title="Active Streak"
          value={`${streak?.currentStreak || 14} Days`}
          subtitle={`Best: ${streak?.longestStreak || 28} Days`}
          trend={{ value: 'Top 5% Scholars', isPositive: true }}
          icon={Flame}
          colorVariant="amber"
        />
        <StatsCard
          title="Due Active Recalls"
          value="18 Cards"
          subtitle="3 high priority"
          trend={{ value: 'Optimal decay window', isPositive: true }}
          icon={RotateCcw}
          colorVariant="blue"
        />
      </div>

      {/* Subject Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary-400" />
              Active Subjects & Mastery Progress
            </h3>
            <p className="text-xs text-slate-400">
              Personalized knowledge graphs mapped from your uploaded documents
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Library
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="glass-card glass-card-hover rounded-2xl p-5 border border-surface-border flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: `${sub.color}25`, border: `1px solid ${sub.color}40`, color: sub.color }}
                    >
                      {sub.code.split('-')[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-primary-300 transition-colors">
                        {sub.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">{sub.code}</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      sub.masteryLevel === 'Master'
                        ? 'cyan'
                        : sub.masteryLevel === 'Proficient'
                        ? 'primary'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {sub.masteryLevel}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-surface-border/60">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Mastery</span>
                    <span className="text-slate-200 font-bold">{sub.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sub.progress}%`,
                        backgroundColor: sub.color,
                        boxShadow: `0 0 10px ${sub.color}80`
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{sub.totalDocuments} Docs</span>
                  <span>•</span>
                  <span>{sub.flashcardsCount} Cards</span>
                  <span>•</span>
                  <span>{sub.totalQuizzes} Quizzes</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/study-room`)}
                  >
                    Open Reader
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/practice`)}
                  >
                    Practice
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Activity Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-surface-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-cyan" />
                Weekly Study Time & Retention Trend
              </h3>
              <p className="text-xs text-slate-400">
                Hours studied per week against target goals
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-500" /> Studied (Hours)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" /> Target (8h)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.weeklyStudyHours || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1422',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                  }}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                />
                <Bar dataKey="hours" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Actual Hours" />
                <Bar dataKey="target" fill="#334155" radius={[6, 6, 0, 0]} name="Target Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Topics Alert Card */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Weak Topics Focus
              </h3>
              <Badge variant="danger" size="sm">Action Needed</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              AI identified retention decay in these concepts based on recent quizzes:
            </p>

            <div className="space-y-3">
              {weakTopics.map((wt) => (
                <div
                  key={wt.id}
                  className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{wt.topic}</h5>
                      <span className="text-[10px] text-slate-400">{wt.subjectName}</span>
                    </div>
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      {wt.accuracy}% acc
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">
                    {wt.suggestedAction}
                  </p>
                  <button
                    onClick={() => navigate('/practice')}
                    className="mt-2 text-[11px] font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Start 5-min drill <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Revisions & Spaced Repetition Timeline */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              Upcoming Scheduled Revisions
            </h3>
            <p className="text-xs text-slate-400">
              Spaced repetition intervals calculated for maximum long-term memory consolidation
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/planner')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Full Planner
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingRevisions.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-surface-subtle border border-surface-border hover:border-primary-500/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={
                      rev.type === 'flashcards'
                        ? 'primary'
                        : rev.type === 'quiz'
                        ? 'cyan'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {rev.type === 'flashcards'
                      ? 'Flashcards'
                      : rev.type === 'quiz'
                      ? 'Quiz Drill'
                      : 'Doc Review'}
                  </Badge>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      rev.priority === 'high'
                        ? 'text-rose-400'
                        : rev.priority === 'medium'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {rev.priority}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 group-hover:text-primary-300 transition-colors line-clamp-2">
                  {rev.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">{rev.subjectName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {rev.dueDate}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary-400 hover:text-primary-300 p-1"
                  onClick={() => {
                    if (rev.type === 'flashcards') navigate('/flashcards');
                    else if (rev.type === 'quiz') navigate('/practice');
                    else navigate('/study-room');
                  }}
                >
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
