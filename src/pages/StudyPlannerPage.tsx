import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  BookOpen,
  CheckSquare,
  AlertCircle,
  RotateCcw,
  SkipForward,
  CalendarCheck,
  CalendarRange,
  Target,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Trash2
} from 'lucide-react';
import {
  getPlannerOverview,
  createStudyGoal,
  deleteStudyGoal,
  updatePlannerTask,
  reschedulePlanner,
  listDocuments,
  PlannerOverview,
  PlannerTask,
  StudyGoal,
  RAGDocument
} from '../services/ragApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';

export const StudyPlannerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<PlannerOverview | null>(null);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selected date in weekly calendar
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'quiz' | 'flashcards' | 'revision' | 'reading'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'skipped'>('all');

  // Goal Modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Machine Learning Midterm Exam');
  const [goalSubject, setGoalSubject] = useState('Machine Learning & AI');
  const [goalDocId, setGoalDocId] = useState('');
  const [goalExamDate, setGoalExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [targetMastery, setTargetMastery] = useState(90);

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plannerData, docs] = await Promise.all([
        getPlannerOverview(),
        listDocuments().catch(() => [])
      ]);
      setOverview(plannerData);
      setDocuments(docs);

      if (plannerData.active_goal) {
        setGoalTitle(plannerData.active_goal.title);
        setGoalSubject(plannerData.active_goal.subject_name);
        setGoalDocId(plannerData.active_goal.doc_id || '');
        setGoalExamDate(plannerData.active_goal.exam_date);
        setDailyMinutes(plannerData.active_goal.daily_study_minutes);
        setTargetMastery(plannerData.active_goal.target_mastery);
      } else if (docs.length > 0) {
        setGoalDocId(docs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load study planner data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshing(true);
    try {
      const selectedDoc = documents.find(d => d.id === goalDocId);
      await createStudyGoal({
        title: goalTitle,
        subject_name: goalSubject,
        doc_id: goalDocId || null,
        doc_name: selectedDoc ? selectedDoc.filename : 'All Documents',
        exam_date: goalExamDate,
        daily_study_minutes: dailyMinutes,
        target_mastery: targetMastery,
      });

      setIsGoalModalOpen(false);
      await loadPlannerData();
    } catch (err: any) {
      setError(err.message || 'Failed to save study goal');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this study goal and its schedule?')) return;
    setRefreshing(true);
    try {
      await deleteStudyGoal(goalId);
      await loadPlannerData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete goal');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTaskStatus = async (task: PlannerTask) => {
    const nextStatus = task.status === 'completed' ? 'scheduled' : 'completed';
    try {
      const updated = await updatePlannerTask(task.id, nextStatus);
      updateTaskLocally(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const handleSkipTask = async (task: PlannerTask) => {
    try {
      const updated = await updatePlannerTask(task.id, 'skipped');
      updateTaskLocally(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to skip task');
    }
  };

  const handleRescheduleTask = async (task: PlannerTask) => {
    // Moves to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const updated = await updatePlannerTask(task.id, 'rescheduled', tomorrowStr);
      updateTaskLocally(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule task');
    }
  };

  const updateTaskLocally = (updatedTask: PlannerTask) => {
    if (!overview) return;

    const newToday = overview.today_tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    const newWeekly = overview.weekly_tasks.map(t => t.id === updatedTask.id ? updatedTask : t);

    const completedCount = newToday.filter(t => t.status === 'completed').length;
    const pct = newToday.length > 0 ? Math.round((completedCount / newToday.length) * 100) : 0;
    const spentMinutes = newToday
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + (t.duration_minutes || 0), 0);

    setOverview({
      ...overview,
      today_tasks: newToday,
      weekly_tasks: newWeekly,
      today_stats: {
        ...overview.today_stats,
        completed: completedCount,
        percentage: pct,
        minutes_spent: spentMinutes,
      },
    });
  };

  const handleRecalculateSchedule = async () => {
    setRefreshing(true);
    try {
      await reschedulePlanner();
      await loadPlannerData();
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate study plan');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Empty state: no documents uploaded yet
  if (!overview || !overview.has_documents) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E222A] flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#7E79D8]" />
            Intelligent Study Planner & Adaptive Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Balancing active spaced revision, weak topic remediation, and syllabus coverage
          </p>
        </div>

        <div className="bg-white rounded-3xl p-10 text-center max-w-xl mx-auto space-y-5 border border-[#1E222A]/10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#7E79D8]/10 border border-[#7E79D8]/20 flex items-center justify-center mx-auto text-[#7E79D8]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1E222A]">No Course Materials Uploaded</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            LearnSphere extracts topics and generates personalized daily study sessions grounded in your actual course files. Upload a PDF to start scheduling.
          </p>
          <Link to="/library">
            <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
              Go to Document Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Empty state: documents exist but no study goals configured
  if (!overview.has_goals || overview.goals.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E222A] flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-[#7E79D8]" />
              Intelligent Study Planner & Adaptive Schedule
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Personalized spaced revision, weak topic remediation, and syllabus pacing
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsGoalModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Study Goal
          </Button>
        </div>

        <div className="bg-white rounded-3xl p-10 text-center max-w-xl mx-auto space-y-5 border border-[#1E222A]/10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#7E79D8]/10 border border-[#7E79D8]/20 flex items-center justify-center mx-auto text-[#7E79D8]">
            <Target className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#1E222A]">Define Your Target Study Goal</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Set your target exam date, course subject, and daily study time budget. LearnSphere will automatically analyze your weak topics and overdue flashcards to construct your 7-day revision schedule.
            </p>
          </div>
          <Button variant="glow" onClick={() => setIsGoalModalOpen(true)} leftIcon={<Sparkles className="w-4 h-4" />}>
            Configure First Study Goal
          </Button>
        </div>

        {/* Goal Configuration Modal */}
        {renderGoalModal()}
      </div>
    );
  }

  const { active_goal, today_stats, today_tasks, week_days, weekly_tasks, upcoming_deadlines } = overview;
  const displayTasks = weekly_tasks.filter(t => {
    const matchesDate = t.date === selectedDate;
    const matchesType = taskTypeFilter === 'all' || t.type === taskTypeFilter;
    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    return matchesDate && matchesType && matchesStatus;
  });
  const selectedDayInfo = week_days.find(d => d.date === selectedDate);

  function renderGoalModal() {
    if (!isGoalModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-primary-500/30 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E222A]">Configure Study Goal & Schedule</h3>
                <p className="text-xs text-slate-500">Adaptive exam deadline & daily time allocation</p>
              </div>
            </div>
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="text-slate-400 hover:text-[#1E222A] text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E222A]">Goal / Exam Title</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Machine Learning Final Exam"
                required
                className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E222A]">Subject Name</label>
                <input
                  type="text"
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  required
                  className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E222A]">Exam / Target Date</label>
                <input
                  type="date"
                  value={goalExamDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setGoalExamDate(e.target.value)}
                  required
                  className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E222A]">Source Course Document</label>
              <select
                value={goalDocId}
                onChange={(e) => setGoalDocId(e.target.value)}
                className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
              >
                <option value="">All Uploaded Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.total_pages} pages)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E222A] flex items-center justify-between">
                <span>Daily Available Study Time</span>
                <span className="text-[#7E79D8] font-mono font-bold">{dailyMinutes} minutes / day</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      dailyMinutes === mins
                        ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                        : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:bg-slate-200 hover:text-[#1E222A]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1E222A] flex items-center justify-between">
                <span>Target Mastery Level</span>
                <span className="text-[#06b6d4] font-mono font-bold">{targetMastery}%</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[80, 90, 95].map((mast) => (
                  <button
                    key={mast}
                    type="button"
                    onClick={() => setTargetMastery(mast)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      targetMastery === mast
                        ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                        : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:bg-slate-200 hover:text-[#1E222A]'
                    }`}
                  >
                    {mast}% Mastery
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E222A]/10">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsGoalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Save Goal & Generate Schedule
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-4 sm:p-8 paper-dot-grid space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0C1220] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#FF4742] text-white border border-[#0C1220]">
              SCHEDULE MODULE
            </span>
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#00E5FF] text-[#0C1220] border border-[#0C1220]">
              ADAPTIVE PLANNER
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-[#0C1220] flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#FF4742]" />
            STUDY PLANNER & SCHEDULE
          </h2>
          <p className="font-mono text-xs text-[#53627C] mt-1">
            Balancing active spaced revision, weak topic remediation, and syllabus coverage
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculateSchedule}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Recalculate Schedule
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {active_goal ? 'Edit Goal' : 'Create Goal'}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Upcoming Deadlines & Active Goal Banner */}
      {active_goal && upcoming_deadlines.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-primary-500/30 bg-gradient-to-r from-primary-500/10 via-accent-cyan/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-cyan flex items-center justify-center text-white shadow-lg shadow-primary-900/40 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#1E222A]">{active_goal.title}</h3>
                <Badge variant="cyan" size="sm">{active_goal.subject_name}</Badge>
                <Badge variant={upcoming_deadlines[0].days_remaining <= 5 ? 'danger' : 'warning'} size="sm">
                  {upcoming_deadlines[0].days_remaining} Days Left
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Target Exam: <strong>{active_goal.exam_date}</strong> • Daily Budget: <strong>{active_goal.daily_study_minutes} mins</strong> • Target Mastery: <strong>{active_goal.target_mastery}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => handleDeleteGoal(active_goal.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all text-xs"
              title="Delete goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Button variant="outline" size="sm" onClick={() => setIsGoalModalOpen(true)}>
              Settings
            </Button>
          </div>
        </div>
      )}

      {/* Today's Goals Progress Bar */}
      <div className="glass-card p-5 rounded-2xl border border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Sparkles className="w-5 h-5 text-[#7E79D8]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E222A]">
              Today's Revision Goals ({today_stats.completed} of {today_stats.total} Completed)
            </h4>
            <p className="text-[11px] text-slate-500">
              {today_stats.minutes_spent} of {today_stats.minutes_planned} minutes studied today
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#F0F2F8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7E79D8] to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${today_stats.percentage}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#7E79D8]">
            {today_stats.percentage}%
          </span>
        </div>
      </div>

      {/* Weekly Calendar Navigation */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CalendarRange className="w-5 h-5 text-[#7E79D8]" />
            <h3 className="text-base font-bold text-[#1E222A]">
              Weekly Revision Calendar
            </h3>
            <Badge variant="cyan" size="sm">7-Day Adaptive Horizon</Badge>
          </div>
          <span className="text-xs text-slate-500">
            Selected: <strong className="text-[#1E222A]">{selectedDate}</strong> ({selectedDayInfo ? `${selectedDayInfo.day}, ${selectedDate}` : ''})
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {week_days.map((d) => {
            const isSelected = selectedDate === d.date;
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#7E79D8] border-[#7E79D8] text-white shadow-sm ring-2 ring-[#7E79D8]/30'
                    : d.is_today
                    ? 'bg-[#F0F2F8] border-[#7E79D8]/40 text-[#1E222A]'
                    : 'bg-[#F5F6FA] border-[#1E222A]/10 text-slate-600 hover:bg-slate-200 hover:text-[#1E222A]'
                }`}
              >
                <span className="text-[11px] font-semibold block">{d.day}</span>
                <span className="text-sm font-bold block mt-0.5">{d.day_number}</span>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {d.is_today && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" title="Today" />
                  )}
                  <span className="text-[10px] text-slate-400">
                    {d.completed_count}/{d.tasks_count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day's Task List */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-xs font-bold text-[#1E222A] uppercase tracking-wider">
              Tasks for {selectedDayInfo?.day || 'Day'} ({displayTasks.length} Sessions)
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type filter */}
              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value as any)}
                className="bg-[#F5F6FA] border border-[#1E222A]/10 rounded-lg px-2.5 py-1 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
              >
                <option value="all">All Types</option>
                <option value="quiz">Quiz</option>
                <option value="flashcards">Flashcards</option>
                <option value="revision">Revision</option>
                <option value="reading">Reading</option>
              </select>

              {/* Status filter */}
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                className="bg-[#F5F6FA] border border-[#1E222A]/10 rounded-lg px-2.5 py-1 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>

              {selectedDayInfo?.is_today && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 ml-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Today
                </span>
              )}
            </div>
          </div>

          {displayTasks.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#F5F6FA] border border-[#1E222A]/10 text-center text-xs text-slate-500 space-y-2">
              <p>No study sessions scheduled for this date.</p>
              <Button variant="secondary" size="sm" onClick={handleRecalculateSchedule} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                Populate Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTasks.map((t) => {
                const isDone = t.status === 'completed';
                const isSkipped = t.status === 'skipped';

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-emerald-500/5 border-emerald-500/30 opacity-75'
                        : isSkipped
                        ? 'bg-slate-100/50 border-[#1E222A]/10 opacity-50'
                        : 'bg-[#F8F9FD] border-[#1E222A]/10 hover:border-[#7E79D8]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => handleToggleTaskStatus(t)}
                        className="mt-0.5 text-[#7E79D8] hover:text-[#5B54BD] transition-colors shrink-0"
                        title={isDone ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-bold ${
                              isDone ? 'line-through text-slate-400' : 'text-[#1E222A]'
                            }`}
                          >
                            {t.title}
                          </span>

                          <Badge
                            variant={
                              t.type === 'quiz'
                                ? 'cyan'
                                : t.type === 'flashcards'
                                ? 'primary'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {t.type}
                          </Badge>

                          <Badge
                            variant={
                              t.priority === 'high'
                                ? 'danger'
                                : t.priority === 'medium'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {t.priority}
                          </Badge>

                          {isSkipped && <Badge variant="neutral" size="sm">Skipped</Badge>}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#7E79D8]" /> {t.time} ({t.duration_minutes} mins)
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[#06b6d4]" /> {t.doc_name} (p. {t.page_number})
                          </span>
                        </div>

                        {t.reason && (
                          <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-[#1E222A]/5 mt-1 max-w-2xl">
                            <span className="font-semibold text-[#7E79D8]">Adaptive Reason: </span>
                            {t.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {!isDone && !isSkipped && (
                        <>
                          <button
                            onClick={() => handleSkipTask(t)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#1E222A] border border-[#1E222A]/10 hover:bg-slate-200 flex items-center gap-1 transition-all"
                            title="Skip this task"
                          >
                            <SkipForward className="w-3.5 h-3.5" /> Skip
                          </button>
                          <button
                            onClick={() => handleRescheduleTask(t)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-700 border border-[#1E222A]/10 hover:bg-amber-50 flex items-center gap-1 transition-all"
                            title="Reschedule to tomorrow"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Tomorrow
                          </button>
                        </>
                      )}

                      <Link to={t.action_url}>
                        <Button variant="glow" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                          Launch
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goal Configuration Modal */}
      {renderGoalModal()}
    </div>
  );
};
