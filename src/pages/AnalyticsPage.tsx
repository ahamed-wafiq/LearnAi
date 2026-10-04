import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Sparkles,
  Layers,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { StudyService } from '../services/studyService';
import { AnalyticsData } from '../types';
import { StatsCard } from '../components/ui/StatsCard';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await StudyService.getAnalytics();
        setAnalytics(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-primary-400" />
          Learning Analytics & Mastery Heatmap
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Cognitive retention decay tracking and objective performance metrics
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overall Mastery"
          value={`${analytics.overallMastery}%`}
          subtitle="Top tier across 5 subjects"
          trend={{ value: '+5.4% this month', isPositive: true }}
          icon={Award}
          colorVariant="violet"
        />
        <StatsCard
          title="Retention Rate"
          value={`${analytics.retentionRate}%`}
          subtitle="Calculated over 30 days"
          trend={{ value: 'Above baseline (+9%)', isPositive: true }}
          icon={Brain}
          colorVariant="cyan"
        />
        <StatsCard
          title="Total Study Hours"
          value={`${analytics.totalStudyHours}h`}
          subtitle="Across 38 active sessions"
          trend={{ value: '+8.2h vs past month', isPositive: true }}
          icon={Clock}
          colorVariant="blue"
        />
        <StatsCard
          title="Quizzes Passed"
          value={analytics.quizzesCompleted}
          subtitle="Average score: 84%"
          trend={{ value: '14 Perfect Scores', isPositive: true }}
          icon={ShieldCheck}
          colorVariant="emerald"
        />
      </div>

      {/* Topic Mastery Heatmap Matrix */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-cyan" />
              Skill & Concept Mastery Heatmap
            </h3>
            <p className="text-xs text-slate-400">
              Color intensity indicates recall stability; badges show estimated memory decay timeline
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/50" /> &gt;80% Mastered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/50" /> 50-80% Consolidating
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/50" /> &lt;50% At Risk
            </span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {analytics.masteryHeatmap.map((item, idx) => {
            const isHigh = item.level >= 80;
            const isMid = item.level >= 50 && item.level < 80;
            const isLow = item.level < 50;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isHigh
                    ? 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50'
                    : isMid
                    ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500/50'
                    : 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.decayDays <= 2
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-surface-light text-slate-400'
                      }`}
                    >
                      Decay in {item.decayDays}d
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 line-clamp-2">
                    {item.skill}
                  </h4>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border/50 flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHigh ? 'bg-emerald-400' : isMid ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isHigh ? 'text-emerald-400' : isMid ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {item.level}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Score History Line Chart */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                Quiz Score Progression
              </h3>
              <p className="text-xs text-slate-400">
                Score performance over consecutive drill sessions
              </p>
            </div>
            <Badge variant="success" size="sm">Upward Trend</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.quizHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[40, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1422',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                  name="Score %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery & Study Time Comparison */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-cyan" />
                Subject Mastery & Time Allocation
              </h3>
              <p className="text-xs text-slate-400">
                Mastery % compared against total hours dedicated
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.subjectMastery}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1422',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="mastery" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Mastery %" />
                <Bar dataKey="accuracy" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
