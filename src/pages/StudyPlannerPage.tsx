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
  AlertCircle
} from 'lucide-react';
import { StudyService } from '../services/studyService';
import { PlannerEvent, Subject } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const StudyPlannerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-03');

  // New event modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Machine Learning & AI');
  const [newDate, setNewDate] = useState('2026-10-04');
  const [newTime, setNewTime] = useState('14:00');
  const [newDuration, setNewDuration] = useState(45);
  const [newType, setNewType] = useState<'revision' | 'quiz' | 'reading' | 'assignment'>('revision');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, subsData] = await Promise.all([
          StudyService.getPlannerEvents(),
          StudyService.getSubjects()
        ]);
        setEvents(eventsData);
        setSubjects(subsData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleEvent = async (id: string) => {
    const updated = await StudyService.toggleEventStatus(id);
    if (updated) {
      setEvents(prev => prev.map(e => (e.id === id ? { ...updated } : e)));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await StudyService.addPlannerEvent({
      title: newTitle,
      date: newDate,
      time: newTime,
      durationMinutes: Number(newDuration),
      type: newType,
      subjectName: newSubject,
      status: 'scheduled',
      priority: newPriority
    });

    setEvents(prev => [...prev, created]);
    setIsModalOpen(false);
    setNewTitle('');
  };

  const daysOfWeek = [
    { day: 'Mon', date: '2026-10-01' },
    { day: 'Tue', date: '2026-10-02' },
    { day: 'Wed', date: '2026-10-03', isToday: true },
    { day: 'Thu', date: '2026-10-04' },
    { day: 'Fri', date: '2026-10-05' },
    { day: 'Sat', date: '2026-10-06' },
    { day: 'Sun', date: '2026-10-07' }
  ];

  const todayEvents = events.filter(e => e.date === selectedDate || e.date === '2026-10-03');
  const completedToday = todayEvents.filter(e => e.status === 'completed').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-primary-400" />
            Intelligent Study Planner & Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated spaced revision sessions calculated to maintain 90%+ recall
          </p>
        </div>

        <Button
          variant="glow"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Revision
        </Button>
      </div>

      {/* Daily Goals Progress Bar */}
      <div className="glass-card p-5 rounded-2xl border border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Sparkles className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              Today's Revision Goals ({completedToday} of {todayEvents.length || 2} Completed)
            </h4>
            <p className="text-[11px] text-slate-400">
              Complete scheduled slots to extend your 14-day study streak
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 flex items-center gap-3">
          <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{
                width: `${todayEvents.length > 0 ? (completedToday / todayEvents.length) * 100 : 50}%`
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-primary-300">
            {todayEvents.length > 0
              ? `${Math.round((completedToday / todayEvents.length) * 100)}%`
              : '50%'}
          </span>
        </div>
      </div>

      {/* Week Calendar View */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-100">
              October 2026 — Week 40
            </h3>
            <Badge variant="cyan" size="sm">Current Week</Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                viewMode === 'week'
                  ? 'bg-primary-600 text-white border-primary-500'
                  : 'bg-surface-subtle text-slate-400 border-surface-border'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                viewMode === 'month'
                  ? 'bg-primary-600 text-white border-primary-500'
                  : 'bg-surface-subtle text-slate-400 border-surface-border'
              }`}
            >
              Month View
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((d, idx) => {
            const isSelected = selectedDate === d.date;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(d.date)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-primary-600/20 border-primary-500 text-white shadow-glow-primary/20'
                    : d.isToday
                    ? 'bg-surface-light border-primary-500/40 text-slate-200'
                    : 'bg-surface-subtle border-surface-border text-slate-400 hover:bg-surface-light hover:text-white'
                }`}
              >
                <span className="text-[11px] font-semibold block">{d.day}</span>
                <span className="text-sm font-bold block mt-0.5">
                  {d.date.split('-')[2]}
                </span>
                {d.isToday && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-cyan mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Events Schedule for Selected Day */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Scheduled Sessions ({events.length} Items)
          </h4>

          <div className="divide-y divide-surface-border/60">
            {events.map((ev) => {
              const isDone = ev.status === 'completed';

              return (
                <div
                  key={ev.id}
                  className={`py-3.5 px-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'opacity-60 bg-surface-subtle/40'
                      : 'hover:bg-surface-light/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleEvent(ev.id)}
                      className="mt-0.5 text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-bold ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {ev.title}
                        </span>
                        <Badge
                          variant={
                            ev.type === 'revision'
                              ? 'primary'
                              : ev.type === 'quiz'
                              ? 'cyan'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {ev.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {ev.time} ({ev.durationMinutes} min)
                        </span>
                        <span>•</span>
                        <span>{ev.subjectName}</span>
                        {ev.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic truncate max-w-xs">{ev.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ev.priority === 'high'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : ev.priority === 'medium'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-surface-light text-slate-400'
                      }`}
                    >
                      {ev.priority} Priority
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Revision Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Revision Session"
        description="Add a personalized spaced repetition or test prep block to your study calendar."
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Session Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Attention Mechanism Proofs Drill"
              required
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Session Type
              </label>
              <select
                value={newType}
                onChange={(e: any) => setNewType(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="revision">Active Revision</option>
                <option value="quiz">Practice Quiz</option>
                <option value="reading">Deep Reading</option>
                <option value="assignment">Assignment Drill</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="glow">
              Add to Calendar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
