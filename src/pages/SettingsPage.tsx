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
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-4 sm:p-8 paper-dot-grid space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0C1220] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#FF4742] text-white border border-[#0C1220]">
              CONFIG MODULE
            </span>
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#00E5FF] text-[#0C1220] border border-[#0C1220]">
              SYSTEM PREFERENCES
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-[#0C1220] flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#FF4742]" />
            PLATFORM SETTINGS & CONFIG
          </h2>
          <p className="font-mono text-xs text-[#53627C] mt-1">
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
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 border-2 border-[#0C1220] bg-[#FF4742]/10 text-[#FF4742] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220]">FastAPI & Gemini RAG Service</h3>
                <span className="font-arcade text-[10px] text-slate-500 uppercase">Endpoint: http://localhost:8000/api</span>
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

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 border-2 border-[#0C1220] bg-[#FBF5E6] shadow-[1px_1px_0px_#0C1220] text-xs">
              <span className="font-arcade uppercase font-bold text-[#0C1220]">FastAPI Connection</span>
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

            <div className="flex items-center justify-between p-3 border-2 border-[#0C1220] bg-[#FBF5E6] shadow-[1px_1px_0px_#0C1220] text-xs">
              <span className="font-arcade uppercase font-bold text-[#0C1220]">Google Gemini API</span>
              {health?.gemini_configured ? (
                <Badge variant="primary" size="sm">
                  <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">API Key Missing</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 border-2 border-[#0C1220] bg-[#FBF5E6] shadow-[1px_1px_0px_#0C1220] text-xs">
              <span className="font-arcade uppercase font-bold text-[#0C1220]">FAISS Vector Index</span>
              <span className="font-arcade font-bold text-[#0C1220]">
                {health?.index?.total_vectors || 0} vectors ({health?.index?.total_chunks || 0} chunks)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 border-2 border-[#0C1220] bg-[#FBF5E6] shadow-[1px_1px_0px_#0C1220] text-xs">
              <span className="font-arcade uppercase font-bold text-[#0C1220]">Indexed Course Documents</span>
              <span className="font-arcade font-bold text-[#FF4742]">
                {health?.documents_count || 0} PDF(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Study Pacing & Planner Preferences */}
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b-2 border-[#0C1220] pb-3">
            <div className="w-9 h-9 border-2 border-[#0C1220] bg-[#F8C02F]/20 text-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#FF4742]" />
            </div>
            <div>
              <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220]">Daily Pacing & Study Goals</h3>
              <span className="font-arcade text-[10px] text-slate-500 uppercase">Used by the adaptive study planner</span>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Daily study budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220] flex items-center justify-between">
                <span>Daily Target Study Time</span>
                <span className="font-bold text-[#FF4742]">{dailyBudget} minutes / day</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyBudget(mins)}
                    className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                      dailyBudget === mins
                        ? 'bg-[#FF4742] text-white -translate-y-0.5'
                        : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Default Quiz Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Default Practice Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDefaultDifficulty(diff)}
                    className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                      defaultDifficulty === diff
                        ? 'bg-[#FF4742] text-white -translate-y-0.5'
                        : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Quiz Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Default Questions per Drill</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDefaultQuestions(num)}
                    className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                      defaultQuestions === num
                        ? 'bg-[#FF4742] text-white -translate-y-0.5'
                        : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: AI Tutor Persona */}
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b-2 border-[#0C1220] pb-3">
            <div className="w-9 h-9 border-2 border-[#0C1220] bg-[#00E5FF]/20 text-[#0C1220] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#0C1220]" />
            </div>
            <div>
              <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220]">AI Study Room Persona</h3>
              <span className="font-arcade text-[10px] text-slate-500 uppercase">Controls tone and pedagogical grounding</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { id: 'analytical', name: 'Analytical & Grounded', desc: 'Focuses strictly on formula derivations and citations from the PDF.' },
              { id: 'socratic', name: 'Socratic Coach', desc: 'Asks guiding questions to stimulate active recall before revealing answers.' },
              { id: 'concise', name: 'Concise Bullet Points', desc: 'Provides brief, high-density summaries ideal for quick review.' },
            ].map((p) => (
              <label
                key={p.id}
                onClick={() => setAiPersona(p.id)}
                className={`p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] cursor-pointer transition-all flex items-start gap-3 select-none active:translate-x-[1px] active:translate-y-[1px] ${
                  aiPersona === p.id
                    ? 'bg-[#00E5FF]/20 text-[#0C1220]'
                    : 'bg-[#FFFDF7] text-slate-700 hover:bg-[#F5EDE0]'
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  checked={aiPersona === p.id}
                  onChange={() => setAiPersona(p.id)}
                  className="mt-1 accent-[#FF4742]"
                />
                <div>
                  <h4 className="font-arcade text-xs uppercase font-bold text-[#0C1220]">{p.name}</h4>
                  <p className="text-[11px] text-slate-600 font-sans mt-0.5">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Card 4: Learning Model Sync & Maintenance */}
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b-2 border-[#0C1220] pb-3">
            <div className="w-9 h-9 border-2 border-[#0C1220] bg-emerald-100 text-emerald-800 shadow-[2px_2px_0px_#0C1220] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#059669]" />
            </div>
            <div>
              <h3 className="font-pixel text-sm font-bold uppercase text-[#0C1220]">Analytics Sync & Maintenance</h3>
              <span className="font-arcade text-[10px] text-slate-500 uppercase">Trigger model re-training and schedule pacing</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Force an immediate recomputation of the scikit-learn logistic regression weakness weights, cognitive retention decay curves, and adaptive 7-day study schedule.
            </p>

            <Button
              variant="secondary"
              onClick={handleRecalculateAll}
              isLoading={isSyncing}
              className="w-full justify-center"
              leftIcon={<RefreshCw className="w-4 h-4 text-[#FF4742]" />}
            >
              Recompute Analytics & Reschedule Planner
            </Button>

            <div className="pt-2 border-t-2 border-[#0C1220]/20 flex items-center justify-between text-xs font-arcade uppercase text-slate-600">
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
