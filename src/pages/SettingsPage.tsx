import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Bell,
  Cpu,
  Database,
  Trash2,
  Sliders,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { checkHealth, RAGHealthResponse, recalculateAnalytics, reschedulePlanner } from '../services/ragApi';

export const SettingsPage: React.FC = () => {
  // Health & System state
  const [health, setHealth] = useState<RAGHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Preference states (stored in localStorage)
  const [dailyBudget, setDailyBudget] = useState<number>(() => {
    return parseInt(localStorage.getItem('learnsphere_daily_budget') || '45', 10);
  });
  const [defaultDifficulty, setDefaultDifficulty] = useState<string>(() => {
    return localStorage.getItem('learnsphere_default_difficulty') || 'Medium';
  });
  const [defaultQuestions, setDefaultQuestions] = useState<number>(() => {
    return parseInt(localStorage.getItem('learnsphere_default_questions') || '5', 10);
  });
  const [aiPersona, setAiPersona] = useState<string>(() => {
    return localStorage.getItem('learnsphere_ai_persona') || 'analytical';
  });
  const [enableSpacedNotifications, setEnableSpacedNotifications] = useState<boolean>(() => {
    return localStorage.getItem('learnsphere_spaced_notifications') !== 'false';
  });

  // Action status
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'FastAPI backend unreachable');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('learnsphere_daily_budget', dailyBudget.toString());
    localStorage.setItem('learnsphere_default_difficulty', defaultDifficulty);
    localStorage.setItem('learnsphere_default_questions', defaultQuestions.toString());
    localStorage.setItem('learnsphere_ai_persona', aiPersona);
    localStorage.setItem('learnsphere_spaced_notifications', enableSpacedNotifications.toString());

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRecalculateAll = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        recalculateAnalytics().catch(() => null),
        reschedulePlanner().catch(() => null)
      ]);
      await loadHealth();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E222A] flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#7E79D8]" />
            Platform Settings & AI Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure your AI tutor persona, study pacing budgets, backend integrations, and ML models
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSavePreferences}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          {saveSuccess ? 'Saved Successfully!' : 'Save Preferences'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Backend & AI Engine Diagnostics */}
        <div className="bg-white rounded-3xl p-6 border border-[#1E222A]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#7E79D8]/15 text-[#5B54BD] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E222A]">FastAPI & Gemini RAG Service</h3>
                <span className="text-[11px] text-slate-400">Endpoint: http://localhost:8000/api</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadHealth}
              disabled={healthLoading}
              title="Ping backend health endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F6FA] border border-[#1E222A]/5 text-xs">
              <span className="font-semibold text-slate-600">FastAPI Connection</span>
              {health?.status === 'ok' ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </Badge>
              ) : healthLoading ? (
                <Badge variant="neutral" size="sm">Checking...</Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  <AlertCircle className="w-3 h-3" /> Offline
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F6FA] border border-[#1E222A]/5 text-xs">
              <span className="font-semibold text-slate-600">Google Gemini API</span>
              {health?.gemini_configured ? (
                <Badge variant="primary" size="sm">
                  <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash Configured
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">API Key Missing</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F6FA] border border-[#1E222A]/5 text-xs">
              <span className="font-semibold text-slate-600">FAISS Vector Index</span>
              <span className="font-mono font-bold text-[#1E222A]">
                {health?.index?.total_vectors || 0} vectors ({health?.index?.total_chunks || 0} chunks)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F6FA] border border-[#1E222A]/5 text-xs">
              <span className="font-semibold text-slate-600">Indexed Course Documents</span>
              <span className="font-bold text-[#1E222A]">
                {health?.documents_count || 0} PDF(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Study Pacing & Planner Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-[#1E222A]/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F99F5B]/15 text-[#E8873F] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E222A]">Daily Pacing & Study Goals</h3>
              <span className="text-[11px] text-slate-400">Used by the adaptive study planner</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Daily study budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Daily Target Study Time</span>
                <span className="font-bold text-[#7E79D8]">{dailyBudget} minutes / day</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyBudget(mins)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      dailyBudget === mins
                        ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                        : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:border-[#7E79D8]/50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Default Quiz Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Practice Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDefaultDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      defaultDifficulty === diff
                        ? 'bg-[#F99F5B] text-white border-[#F99F5B] shadow-sm'
                        : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:border-[#F99F5B]/50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Quiz Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Questions per Drill</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDefaultQuestions(num)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      defaultQuestions === num
                        ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                        : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:border-[#7E79D8]/50'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: AI Tutor Persona */}
        <div className="bg-white rounded-3xl p-6 border border-[#1E222A]/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E222A]">AI Study Room Persona</h3>
              <span className="text-[11px] text-slate-400">Controls tone and pedagogical grounding</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {[
              { id: 'analytical', name: 'Analytical & Grounded', desc: 'Focuses strictly on formula derivations and citations from the PDF.' },
              { id: 'socratic', name: 'Socratic Coach', desc: 'Asks guiding questions to stimulate active recall before revealing answers.' },
              { id: 'concise', name: 'Concise Bullet Points', desc: 'Provides brief, high-density summaries ideal for quick review.' },
            ].map((p) => (
              <label
                key={p.id}
                onClick={() => setAiPersona(p.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  aiPersona === p.id
                    ? 'bg-[#7E79D8]/10 border-[#7E79D8] text-[#1E222A]'
                    : 'bg-[#F5F6FA] border-[#1E222A]/10 text-slate-600 hover:bg-[#EEF0F8]'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  checked={aiPersona === p.id}
                  onChange={() => setAiPersona(p.id)}
                  className="mt-1 accent-[#7E79D8]"
                />
                <div>
                  <h4 className="text-xs font-bold text-[#1E222A]">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Card 4: Learning Model Sync & Maintenance */}
        <div className="bg-white rounded-3xl p-6 border border-[#1E222A]/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E222A]">Analytics Sync & Maintenance</h3>
              <span className="text-[11px] text-slate-400">Trigger model re-training and schedule pacing</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Force an immediate recomputation of the scikit-learn logistic regression weakness weights, cognitive retention decay curves, and adaptive 7-day study schedule.
            </p>

            <Button
              variant="secondary"
              onClick={handleRecalculateAll}
              isLoading={isSyncing}
              className="w-full justify-center"
              leftIcon={<RefreshCw className="w-4 h-4 text-[#7E79D8]" />}
            >
              Recompute Analytics & Reschedule Planner
            </Button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounded RAG Safe
              </span>
              <span>All changes local & persistent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
