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
  ShieldCheck,
  RotateCcw,
  BookOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  Flame,
  Calendar,
  ChevronRight,
  CheckSquare
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
  Legend
} from 'recharts';
import {
  getLearningAnalytics,
  recalculateAnalytics,
  LearningAnalyticsPayload,
  TopicAnalytics,
  WeakTopicItem,
  RevisionTaskItem,
  SpacedRepetitionCard
} from '../services/ragApi';
import { StatsCard } from '../components/ui/StatsCard';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<LearningAnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMLModal, setShowMLModal] = useState(false);
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'weak' | 'consolidating' | 'strong'>('all');
  const [docFilter, setDocFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLearningAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load learning analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRefreshing(true);
    try {
      const fresh = await recalculateAnalytics();
      setAnalytics(fresh);
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate analytics');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
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

  // Error state
  if (error && !analytics) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4 border border-rose-500/30">
        <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Analytics Unavailable</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        <Button variant="glow" size="sm" onClick={fetchAnalyticsData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Empty state: no quiz or flashcard history exists
  if (!analytics || !analytics.has_data || analytics.topics.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="font-pixel text-xl sm:text-2xl font-bold uppercase text-[#0C1220] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#FF4742]" />
            Learning Analytics & ML Mastery
          </h2>
          <p className="font-arcade text-xs text-slate-500 uppercase mt-1">
            Real-time mastery tracking, scikit-learn weakness predictions, and spaced repetition
          </p>
        </div>

        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center mx-auto text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
            <Brain className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-pixel text-xl uppercase font-bold text-[#0C1220]">No Quiz or Review Activity Recorded Yet</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
              Learn AI calculates real topic mastery and predictive weakness models from your actual study history. Take your first quiz or review flashcards to populate this dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/practice">
              <Button variant="primary" leftIcon={<CheckSquare className="w-4 h-4" />}>
                Take Practice Quiz
              </Button>
            </Link>
            <Link to="/flashcards">
              <Button variant="secondary" leftIcon={<Layers className="w-4 h-4" />}>
                Review Flashcards
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    overall_mastery,
    retention_rate,
    total_quizzes_completed,
    total_questions_answered,
    total_flashcards_reviewed,
    topics,
    strong_topics,
    weak_topics,
    accuracy_trend,
    revision_tasks,
    spaced_repetition,
    ml_diagnostics
  } = analytics;

  const availableDocs = Array.from(new Set(topics.map((t) => t.source_doc))).filter(Boolean);
  const filteredTopics = topics.filter((t) => {
    const matchesClass = classificationFilter === 'all' || t.classification === classificationFilter;
    const matchesDoc = docFilter === 'all' || t.source_doc === docFilter;
    return matchesClass && matchesDoc;
  });

  return (
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-4 sm:p-8 paper-dot-grid space-y-8">
      {/* Top Banner & ML Diagnostic Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0C1220] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#FF4742] text-white border border-[#0C1220]">
              TELEMETRY MODULE
            </span>
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#00E5FF] text-[#0C1220] border border-[#0C1220]">
              COGNITIVE MASTERY
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-[#0C1220] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#FF4742]" />
            LEARNING ANALYTICS & MASTERY
          </h2>
          <p className="font-mono text-xs text-[#53627C] mt-1">
            Predictive weakness modeling, cognitive retention decay, and personalized revision scheduling
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* ML Model Status Pill */}
          <button
            onClick={() => setShowMLModal(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              ml_diagnostics.is_trained
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-primary-500/15 border-primary-500/40 text-primary-300 hover:bg-primary-500/25'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-accent-cyan" />
            <span>
              {ml_diagnostics.is_trained ? 'Scikit-Learn ML Active' : 'Heuristic Baseline Active'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10">
              {ml_diagnostics.samples_count}/{ml_diagnostics.min_samples_required} samples
            </span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculate}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Recalculate
          </Button>
        </div>
      </div>

      {/* ML DIAGNOSTICS MODAL */}
      {showMLModal && (
        <div className="fixed inset-0 z-50 bg-[#0C1220]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg border-2 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
                  <Brain className="w-5 h-5 text-[#FF4742]" />
                </div>
                <div>
                  <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220]">ML Model Diagnostics</h3>
                  <p className="font-arcade text-[10px] text-slate-500 uppercase">Topic-level weakness prediction architecture</p>
                </div>
              </div>
              <button
                onClick={() => setShowMLModal(false)}
                className="text-[#0C1220] hover:text-[#FF4742] text-xl font-bold font-arcade"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-[#F5F6FA] border border-[#1E222A]/10 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Model State</span>
                <p className="font-semibold text-[#1E222A]">{ml_diagnostics.status_note}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6FA] border border-[#1E222A]/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline Specification</span>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• <strong>Algorithm:</strong> {ml_diagnostics.is_trained ? 'scikit-learn LogisticRegression (calibrated probabilities)' : 'Statistical Heuristic Baseline (sample threshold < 8)'}</li>
                  <li>• <strong>Training Samples:</strong> {ml_diagnostics.samples_count} collected (min. {ml_diagnostics.min_samples_required} required for ML training)</li>
                  <li>• <strong>Features:</strong> Quiz Error Rate, Flashcard Distress Rate, Time Decay Interval, Difficulty Scaling Factor, Attempt Volume</li>
                  <li>• <strong>Validation Note:</strong> Predictions are adaptive estimates to guide revision and are never presented as guaranteed scores.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="glow" size="sm" onClick={() => setShowMLModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overall Topic Mastery"
          value={`${overall_mastery}%`}
          subtitle={`Across ${topics.length} active topics`}
          trend={{ value: `${strong_topics.length} Mastered`, isPositive: true }}
          icon={Award}
          colorVariant="violet"
        />
        <StatsCard
          title="Quiz Accuracy"
          value={`${retention_rate}%`}
          subtitle={`${total_questions_answered} questions answered`}
          trend={{ value: `${total_quizzes_completed} Quizzes Completed`, isPositive: true }}
          icon={ShieldCheck}
          colorVariant="emerald"
        />
        <StatsCard
          title="Flashcards In Review"
          value={spaced_repetition.due_today_count}
          subtitle={`${spaced_repetition.total_cards} cards scheduled`}
          trend={{ value: `${spaced_repetition.due_this_week_count} due this week`, isPositive: false }}
          icon={RotateCcw}
          colorVariant="cyan"
        />
        <StatsCard
          title="Active Weak Topics"
          value={weak_topics.length}
          subtitle="Identified for revision"
          trend={{ value: weak_topics.length === 0 ? 'All topics steady' : 'Needs attention', isPositive: weak_topics.length === 0 }}
          icon={AlertTriangle}
          colorVariant="blue"
        />
      </div>

      {/* Weak Topics & Revision Recommendations Alert Section */}
      {weak_topics.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#1E222A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Predicted Weak Topics Requiring Focus
              </h3>
              <p className="text-xs text-slate-500">
                Topics flagged by the {ml_diagnostics.model_type === 'heuristic_baseline' ? 'heuristic baseline' : 'scikit-learn predictor'} based on past mistakes and flashcard reviews
              </p>
            </div>
            <span className="text-[11px] text-slate-400 italic">
              *Probabilistic estimates to guide your revision, not fixed assessments.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {weak_topics.map((wt, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-surface/80 border border-surface-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#1E222A]">{wt.topic}</h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3 text-accent-cyan" />
                      {wt.source_doc} (Page {wt.page_number})
                    </span>
                  </div>
                  <Badge variant="danger" size="sm">
                    {wt.weakness_probability}% Weakness Risk
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle text-xs text-slate-600 leading-relaxed border border-surface-border">
                  <span className="font-bold text-rose-600">Why recommended: </span>
                  {wt.reason}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Mastery: <strong className="text-rose-600">{wt.mastery}%</strong>
                  </span>
                  <Link to={`/practice`}>
                    <Button variant="glow" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Drill Topic
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Mastery Heatmap Matrix */}
      <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#0C1220] pb-3">
          <div>
            <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF4742]" />
              Topic & Skill Mastery Heatmap
            </h3>
            <p className="font-arcade text-[10px] text-slate-500 uppercase mt-0.5">
              Calculated from quiz accuracy (55%), flashcard retention (30%), and exponential time decay (15%)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-arcade uppercase text-slate-600 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-[#0C1220] bg-emerald-400" /> &ge;80% Strong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-[#0C1220] bg-amber-400" /> 55-79% Consolidating
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-[#0C1220] bg-rose-400" /> &lt;55% Needs Revision
            </span>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-2 border-b-2 border-[#0C1220]/20">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-arcade uppercase font-bold text-[#0C1220] mr-1">Status:</span>
            {(['all', 'weak', 'consolidating', 'strong'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setClassificationFilter(mode)}
                className={`px-3 py-1 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  classificationFilter === mode
                    ? 'bg-[#FF4742] text-white -translate-y-0.5'
                    : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                }`}
              >
                {mode === 'all' ? 'All' : mode}
              </button>
            ))}
          </div>

          {availableDocs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Document:</span>
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-2.5 py-1 text-xs text-[#0C1220] font-arcade uppercase focus:outline-none"
              >
                <option value="all">All Documents</option>
                {availableDocs.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Heatmap Grid */}
        {filteredTopics.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No topics match the selected status or document filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
            {filteredTopics.map((item, idx) => {
              const isHigh = item.classification === 'strong';
              const isMid = item.classification === 'consolidating';
              const isLow = item.classification === 'weak';

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
                      <Badge
                        variant={isHigh ? 'success' : isMid ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {item.classification}
                      </Badge>
                      <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        Decay in {item.decay_days}d
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#1E222A] line-clamp-2">
                      {item.topic}
                    </h4>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <BookOpen className="w-3 h-3 text-[#00E5FF] shrink-0" />
                      {item.source_doc} (p. {item.page_number})
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-surface-border/50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] text-slate-500">Mastery</span>
                      <span className={`font-bold ${isHigh ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-600'}`}>
                        {item.mastery}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHigh ? 'bg-emerald-500' : isMid ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.mastery}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Score History Line Chart */}
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
            <div>
              <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF4742]" />
                Quiz Score Progression
              </h3>
              <p className="font-arcade text-[10px] text-slate-500 uppercase mt-0.5">
                Score performance across consecutive drill sessions
              </p>
            </div>
            <Badge variant="cyan" size="sm">{accuracy_trend.length} Sessions</Badge>
          </div>

          <div className="h-64 w-full">
            {accuracy_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={accuracy_trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4742" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF4742" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0C1220" strokeOpacity={0.1} />
                  <XAxis dataKey="date" stroke="#0C1220" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#0C1220" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0C1220',
                      border: '2px solid #FF4742',
                      borderRadius: '0px',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#FF4742"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                    name="Score %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-arcade text-xs text-slate-500 uppercase">
                No quiz score history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Topic Mastery & Quiz Accuracy Comparison */}
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
            <div>
              <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#FF4742]" />
                Topic Mastery vs Quiz Accuracy
              </h3>
              <p className="font-arcade text-[10px] text-slate-500 uppercase mt-0.5">
                Comparison of calculated mastery against raw quiz accuracy
              </p>
            </div>
            {filteredTopics.length !== topics.length && (
              <Badge variant="neutral" size="sm">Filtered ({filteredTopics.length}/{topics.length})</Badge>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredTopics}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#0C1220" strokeOpacity={0.1} />
                <XAxis dataKey="topic" stroke="#0C1220" fontSize={9} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#0C1220" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0C1220',
                    border: '2px solid #00E5FF',
                    borderRadius: '0px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'monospace' }} />
                <Bar dataKey="mastery" fill="#FF4742" stroke="#0C1220" strokeWidth={1} name="Mastery %" />
                <Bar dataKey="quiz_accuracy" fill="#00E5FF" stroke="#0C1220" strokeWidth={1} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Personalized Revision Tasks & Spaced Repetition Flashcards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Revision Tasks (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
            <div>
              <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF4742]" />
                Personalized Revision Tasks
              </h3>
              <p className="font-arcade text-[10px] text-slate-500 uppercase mt-0.5">
                Targeted review items generated from past mistakes and weakness patterns
              </p>
            </div>
            <Badge variant="primary" size="sm">{revision_tasks.length} Tasks</Badge>
          </div>

          {revision_tasks.length === 0 ? (
            <div className="p-8 text-center text-xs font-arcade text-slate-500 uppercase">
              No revision tasks needed right now. All topics have strong retention!
            </div>
          ) : (
            <div className="space-y-3">
              {revision_tasks.map((task) => (
                <div key={task.id} className="p-4 border-2 border-[#0C1220] bg-[#FFFDF7] shadow-[2px_2px_0px_#0C1220] space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0C1220]">{task.title}</span>
                        <Badge variant={task.priority === 'high' ? 'danger' : 'warning'} size="sm">
                          {task.priority} priority
                        </Badge>
                      </div>
                      <span className="text-[10px] font-arcade text-slate-600 flex items-center gap-1 mt-0.5 uppercase">
                        <FileText className="w-3 h-3 text-[#FF4742]" />
                        {task.doc_name} (Page {task.page_number}) • ~{task.estimated_minutes} mins
                      </span>
                    </div>

                    <Link to={task.action_url}>
                      <Button variant="glow" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                        Review
                      </Button>
                    </Link>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-[#FBF5E6] p-2.5 border border-[#0C1220] shadow-[1px_1px_0px_#0C1220] font-sans">
                    <span className="font-arcade text-[10px] text-[#FF4742] uppercase font-bold">Target Reason: </span>
                    {task.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spaced-Repetition Schedule (5 cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
            <div>
              <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF4742]" />
                Spaced Repetition Schedule
              </h3>
              <p className="font-arcade text-[10px] text-slate-500 uppercase mt-0.5">
                Prioritizing cards marked 'Review Again'
              </p>
            </div>
            <Link to="/flashcards">
              <Button variant="secondary" size="sm">
                Study Deck
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 border-2 border-[#0C1220] bg-[#FFFDF7] shadow-[1px_1px_0px_#0C1220]">
              <span className="font-arcade text-lg font-bold text-rose-600 block">{spaced_repetition.due_today_count}</span>
              <span className="font-arcade text-[10px] text-slate-600 uppercase">Due Today</span>
            </div>
            <div className="p-3 border-2 border-[#0C1220] bg-[#FFFDF7] shadow-[1px_1px_0px_#0C1220]">
              <span className="font-arcade text-lg font-bold text-amber-600 block">{spaced_repetition.due_this_week_count}</span>
              <span className="font-arcade text-[10px] text-slate-600 uppercase">Due This Week</span>
            </div>
          </div>

          {spaced_repetition.cards.length === 0 ? (
            <div className="p-6 text-center text-xs font-arcade text-slate-500 uppercase">
              No flashcards in review rotation. Create cards from the Library to start spaced repetition.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-none">
              {spaced_repetition.cards.slice(0, 6).map((c, idx) => (
                <div key={idx} className="p-3 border-2 border-[#0C1220] bg-[#FFFDF7] shadow-[1px_1px_0px_#0C1220] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-arcade font-bold text-[#FF4742] truncate max-w-[170px] uppercase">
                      {c.topic}
                    </span>
                    <Badge variant={c.status === 'review' ? 'danger' : c.is_overdue ? 'warning' : 'neutral'} size="sm">
                      {c.status === 'review' ? 'Review Again' : c.is_overdue ? 'Due Today' : `In ${c.interval_days}d`}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#0C1220] line-clamp-2 font-medium">
                    {c.front}
                  </p>
                  <span className="text-[10px] font-arcade text-slate-500 block uppercase">
                    Source: {c.filename} (p. {c.page_number})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
