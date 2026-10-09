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
          <h2 className="font-pixel text-xl sm:text-2xl font-bold uppercase text-[#0C1220] flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#FF4742]" />
            Intelligent Study Planner & Adaptive Schedule
          </h2>
          <p className="font-arcade text-xs text-slate-500 uppercase mt-1">
            Balancing active spaced revision, weak topic remediation, and syllabus coverage
          </p>
        </div>

        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center mx-auto text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-pixel text-xl uppercase font-bold text-[#0C1220]">No Course Materials Uploaded</h3>
          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
            Learn AI extracts topics and generates personalized daily study sessions grounded in your actual course files. Upload a PDF to start scheduling.
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
            <h2 className="font-pixel text-xl sm:text-2xl font-bold uppercase text-[#0C1220] flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-[#FF4742]" />
              Intelligent Study Planner & Adaptive Schedule
            </h2>
            <p className="font-arcade text-xs text-slate-500 uppercase mt-1">
              Personalized spaced revision, weak topic remediation, and syllabus pacing
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsGoalModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Study Goal
          </Button>
        </div>

        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center mx-auto text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
            <Target className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-pixel text-xl uppercase font-bold text-[#0C1220]">Define Your Target Study Goal</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              Set your target exam date, course subject, and daily study time budget. Learn AI will automatically analyze your weak topics and overdue flashcards to construct your 7-day revision schedule.
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
      <div className="fixed inset-0 z-50 bg-[#0C1220]/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#FFFDF7] w-full max-w-lg border-2 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220]">Configure Study Goal & Schedule</h3>
                <p className="font-arcade text-[10px] text-slate-500 uppercase">Adaptive exam deadline & daily time allocation</p>
              </div>
            </div>
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="text-[#0C1220] hover:text-[#FF4742] text-xl font-bold font-arcade"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Goal / Exam Title</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Machine Learning Final Exam"
                required
                className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Subject Name</label>
                <input
                  type="text"
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  required
                  className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Exam / Target Date</label>
                <input
                  type="date"
                  value={goalExamDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setGoalExamDate(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Source Course Document</label>
              <select
                value={goalDocId}
                onChange={(e) => setGoalDocId(e.target.value)}
                className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans focus:outline-none"
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
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220] flex items-center justify-between">
                <span>Daily Available Study Time</span>
                <span className="text-[#FF4742] font-arcade font-bold">{dailyMinutes} minutes / day</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyMinutes(mins)}
                    className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                      dailyMinutes === mins
                        ? 'bg-[#FF4742] text-white -translate-y-0.5'
                        : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220] flex items-center justify-between">
                <span>Target Mastery Level</span>
                <span className="text-[#00E5FF] font-arcade font-bold">{targetMastery}%</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[80, 90, 95].map((mast) => (
                  <button
                    key={mast}
                    type="button"
                    onClick={() => setTargetMastery(mast)}
                    className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                      targetMastery === mast
                        ? 'bg-[#FF4742] text-white -translate-y-0.5'
                        : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                    }`}
                  >
                    {mast}% Mastery
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#0C1220]">
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
      <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-[#0C1220] bg-[#00E5FF]/20 text-[#0C1220] shadow-[1px_1px_0px_#0C1220]">
            <Sparkles className="w-5 h-5 text-[#FF4742]" />
          </div>
          <div>
            <h4 className="font-pixel text-xs uppercase font-bold text-[#0C1220]">
              Today's Revision Goals ({today_stats.completed} of {today_stats.total} Completed)
            </h4>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">
              {today_stats.minutes_spent} of {today_stats.minutes_planned} minutes studied today
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 flex items-center gap-3">
          <div className="flex-1 h-3.5 bg-[#FFFDF7] border-2 border-[#0C1220] overflow-hidden">
            <div
              className="h-full bg-[#FF4742] transition-all duration-300"
              style={{ width: `${today_stats.percentage}%` }}
            />
          </div>
          <span className="font-arcade text-xs font-bold text-[#0C1220]">
            {today_stats.percentage}%
          </span>
        </div>
      </div>

      {/* Weekly Calendar Navigation */}
      <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CalendarRange className="w-5 h-5 text-[#FF4742]" />
            <h3 className="font-pixel text-sm sm:text-base font-bold text-[#0C1220] uppercase">
              Weekly Revision Calendar
            </h3>
            <Badge variant="cyan" size="sm">7-DAY ADAPTIVE HORIZON</Badge>
          </div>
          <span className="font-arcade text-[10px] text-slate-500 uppercase">
            Selected: <strong className="text-[#0C1220]">{selectedDate}</strong> ({selectedDayInfo ? `${selectedDayInfo.day}, ${selectedDate}` : ''})
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
                className={`p-3 border-2 border-[#0C1220] text-center transition-all select-none font-arcade ${
                  isSelected
                    ? 'bg-[#FF4742] text-white shadow-[2px_2px_0px_#0C1220] -translate-y-0.5'
                    : d.is_today
                    ? 'bg-[#00E5FF]/20 text-[#0C1220] shadow-[2px_2px_0px_#0C1220] hover:bg-[#00E5FF]/30'
                    : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0] shadow-[2px_2px_0px_#0C1220]'
                }`}
              >
                <span className="text-[10px] block uppercase font-bold tracking-wider">{d.day}</span>
                <span className="font-pixel text-sm block mt-1">{d.day_number}</span>
                <div className="mt-1.5 flex items-center justify-center gap-1">
                  {d.is_today && (
                    <span className="w-2 h-2 bg-[#00E5FF] border border-[#0C1220]" title="Today" />
                  )}
                  <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
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
            <h4 className="font-arcade text-xs font-bold text-[#0C1220] uppercase tracking-wider">
              Tasks for {selectedDayInfo?.day || 'Day'} ({displayTasks.length} Sessions)
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type filter */}
              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value as any)}
                className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-2.5 py-1 text-xs text-[#0C1220] font-arcade uppercase focus:outline-none"
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
                className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-2.5 py-1 text-xs text-[#0C1220] font-arcade uppercase focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>

              {selectedDayInfo?.is_today && (
                <span className="font-arcade text-[10px] text-emerald-700 font-bold flex items-center gap-1 ml-1 uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Today
                </span>
              )}
            </div>
          </div>

          {displayTasks.length === 0 ? (
            <div className="p-8 bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-center text-xs text-slate-600 space-y-3">
              <p className="font-sans">No study sessions scheduled for this date.</p>
              <Button variant="secondary" size="sm" onClick={handleRecalculateSchedule} leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#FF4742]" />}>
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
                    className={`p-4 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-emerald-500/10 opacity-75'
                        : isSkipped
                        ? 'bg-slate-200/50 opacity-60'
                        : 'bg-[#FFFDF7] hover:bg-[#FFF9EE]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => handleToggleTaskStatus(t)}
                        className="mt-0.5 text-[#0C1220] hover:text-[#FF4742] transition-colors shrink-0"
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
                              isDone ? 'line-through text-slate-400' : 'text-[#0C1220]'
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
                          <span className="flex items-center gap-1 font-arcade text-[10px]">
                            <Clock className="w-3.5 h-3.5 text-[#FF4742]" /> {t.time} ({t.duration_minutes} mins)
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-arcade text-[10px]">
                            <FileText className="w-3.5 h-3.5 text-[#00E5FF]" /> {t.doc_name} (p. {t.page_number})
                          </span>
                        </div>

                        {t.reason && (
                          <p className="text-[11px] text-slate-700 leading-relaxed bg-[#FBF5E6] p-2.5 border border-[#0C1220] shadow-[1px_1px_0px_#0C1220] mt-1 max-w-2xl font-sans">
                            <span className="font-arcade text-[10px] text-[#FF4742] uppercase font-bold">Adaptive Reason: </span>
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
                            className="px-2.5 py-1.5 border-2 border-[#0C1220] shadow-[1px_1px_0px_#0C1220] bg-[#FFFDF7] hover:bg-[#F5EDE0] text-xs font-arcade uppercase text-[#0C1220] flex items-center gap-1 transition-all"
                            title="Skip this task"
                          >
                            <SkipForward className="w-3.5 h-3.5" /> Skip
                          </button>
                          <button
                            onClick={() => handleRescheduleTask(t)}
                            className="px-2.5 py-1.5 border-2 border-[#0C1220] shadow-[1px_1px_0px_#0C1220] bg-[#FFFDF7] hover:bg-[#FFE58F] text-xs font-arcade uppercase text-[#0C1220] flex items-center gap-1 transition-all"
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
