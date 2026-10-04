import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  FileText,
  AlertCircle,
  PlusCircle,
  Loader2,
  History,
  BookOpen,
  Sliders,
  ExternalLink
} from 'lucide-react';
import {
  listDocuments,
  generateQuiz,
  listQuizzes,
  saveQuizResult,
  listQuizResults,
  RAGDocument,
  GeneratedQuiz,
  QuizQuestion,
  QuizResultRecord
} from '../services/ragApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';

export const PracticePage: React.FC = () => {
  // Documents & Quizzes state
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [quizzes, setQuizzes] = useState<GeneratedQuiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null);
  const [pastResults, setPastResults] = useState<QuizResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generator modal / configuration state
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [topicPrompt, setTopicPrompt] = useState<string>('');

  // Active quiz session states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<QuizResultRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'quiz' | 'history'>('quiz');

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, savedQuizzes, results] = await Promise.all([
        listDocuments().catch(() => []),
        listQuizzes().catch(() => []),
        listQuizResults().catch(() => [])
      ]);

      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }

      setQuizzes(savedQuizzes);
      setPastResults(results);

      if (savedQuizzes.length > 0) {
        selectQuiz(savedQuizzes[0]);
      } else if (docs.length > 0) {
        // Automatically open the generator modal if documents exist but no quizzes yet
        setShowGenerator(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuiz = (quiz: GeneratedQuiz) => {
    setCurrentQuiz(quiz);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setActiveQuestionIdx(0);
    setQuizCompleted(false);
    setCurrentResult(null);
    setTimeLeftSeconds(quiz.questions.length * 60); // 1 minute per question
    setIsTimerRunning(true);
    setActiveTab('quiz');
  };

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || quizCompleted || timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, quizCompleted, timeLeftSeconds]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizCompleted) return;
    setUserAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleToggleFlag = (questionIdx: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionIdx)) next.delete(questionIdx);
      else next.add(questionIdx);
      return next;
    });
  };

  const handleGenerateQuiz = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one PDF in the Library first.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const newQuiz = await generateQuiz({
        docId: selectedDocId || undefined,
        numQuestions,
        difficulty,
        topic: topicPrompt.trim() || undefined,
      });

      setQuizzes(prev => [newQuiz, ...prev]);
      setShowGenerator(false);
      selectQuiz(newQuiz);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please check Gemini API connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return;
    setQuizCompleted(true);
    setIsTimerRunning(false);

    let correctCount = 0;
    const formattedAnswers: Record<string, number> = {};

    currentQuiz.questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (ans !== undefined) {
        formattedAnswers[q.id] = ans;
      }
      if (ans === q.correct_index) {
        correctCount += 1;
      }
    });

    const total = currentQuiz.questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const totalTimeAllocated = currentQuiz.questions.length * 60;
    const timeSpent = Math.max(0, totalTimeAllocated - timeLeftSeconds);

    try {
      const saved = await saveQuizResult({
        quiz_id: currentQuiz.id,
        doc_id: currentQuiz.doc_id,
        doc_name: currentQuiz.doc_name,
        score: correctCount,
        total,
        percentage,
        time_taken_seconds: timeSpent,
        user_answers: formattedAnswers,
        questions: currentQuiz.questions,
      });
      setCurrentResult(saved);
      setPastResults(prev => [saved, ...prev]);
    } catch (e) {
      // Fallback local display if offline
      const fallbackResult: QuizResultRecord = {
        id: `res-${Date.now()}`,
        quiz_id: currentQuiz.id,
        doc_id: currentQuiz.doc_id,
        doc_name: currentQuiz.doc_name,
        score: correctCount,
        total,
        percentage,
        time_taken_seconds: timeSpent,
        user_answers: formattedAnswers,
        questions: currentQuiz.questions,
        completed_at: Date.now() / 1000,
      };
      setCurrentResult(fallbackResult);
    }

    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const handleRetakeQuiz = () => {
    if (!currentQuiz) return;
    selectQuiz(currentQuiz);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Empty state: no documents uploaded
  if (documents.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center max-w-xl mx-auto space-y-5 border border-primary-500/20">
        <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mx-auto text-primary-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Study Materials Indexed Yet</h2>
        <p className="text-sm text-slate-300">
          To generate AI-powered multiple-choice questions grounded in your course materials, please upload a PDF document first.
        </p>
        <Link to="/library">
          <Button variant="glow" leftIcon={<FileText className="w-4 h-4" />}>
            Go to Document Library
          </Button>
        </Link>
      </div>
    );
  }

  const currentQ: QuizQuestion | undefined = currentQuiz?.questions[activeQuestionIdx];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-primary-400" />
            AI Practice & Question Drills
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Multiple-choice quizzes generated directly from your uploaded course PDFs using RAG & Gemini
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-subtle border border-surface-border rounded-xl p-1">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quiz' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Current Quiz
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Past Attempts ({pastResults.length})
            </button>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setShowGenerator(true)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Create Quiz from PDF
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
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

      {/* GENERATOR MODAL */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-primary-500/30 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Generate Quiz from Document</h3>
                  <p className="text-xs text-slate-400">Grounded in RAG chunks with page citations</p>
                </div>
              </div>
              <button
                onClick={() => !generating && setShowGenerator(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Document Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Source Document</span>
                  <span className="text-[11px] text-primary-400">{documents.length} PDF(s) available</span>
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={generating}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Uploaded Documents</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.total_pages} pages, {doc.chunks_count} chunks)
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Questions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Number of Questions</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={generating}
                      onClick={() => setNumQuestions(num)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        numQuestions === num
                          ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                          : 'bg-surface-subtle text-slate-400 border-surface-border hover:bg-surface-light'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      disabled={generating}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === diff
                          ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                          : 'bg-surface-subtle text-slate-400 border-surface-border hover:bg-surface-light'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Prompt (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Focus Topic / Keyword <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regularization, Gradient Descent, Overfitting..."
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  disabled={generating}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <Button
                variant="secondary"
                size="sm"
                disabled={generating}
                onClick={() => setShowGenerator(false)}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                size="sm"
                disabled={generating}
                onClick={handleGenerateQuiz}
                leftIcon={generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {generating ? 'Generating Questions...' : 'Generate with Gemini'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PAST ATTEMPTS TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary-400" />
              Saved Quiz Attempts & Scores
            </h3>
            <span className="text-xs text-slate-400">{pastResults.length} completed sessions</span>
          </div>

          {pastResults.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-xs">
              No quiz attempts completed yet. Finish a quiz drill to track your mastery scores here!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastResults.map((res) => (
                <div key={res.id} className="glass-card rounded-2xl p-5 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary-400 truncate max-w-[180px]">
                      {res.doc_name || 'General Quiz'}
                    </span>
                    <Badge variant={res.percentage >= 70 ? 'success' : 'warning'} size="sm">
                      {res.percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Score: <strong>{res.score} / {res.total}</strong></span>
                    <span>Time: <strong>{formatTime(res.time_taken_seconds)}</strong></span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        res.percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${res.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {new Date(res.completed_at * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <>
          {/* Quiz Deck Selector Tabs */}
          {quizzes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => selectQuiz(q)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                    currentQuiz?.id === q.id
                      ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                      : 'bg-surface text-slate-400 border-surface-border hover:text-white hover:bg-surface-light'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{q.topic || q.doc_name}</span>
                  <Badge variant="cyan" size="sm">{q.questions.length} Qs</Badge>
                </button>
              ))}
            </div>
          )}

          {currentQuiz && currentQ && !quizCompleted ? (
            /* ACTIVE QUIZ SCREEN */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Question Area (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                {/* Top Info Bar */}
                <div className="glass-card p-4 rounded-2xl border border-surface-border flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="primary">{currentQuiz.doc_name}</Badge>
                    <span className="text-xs font-semibold text-slate-300">
                      Question {activeQuestionIdx + 1} of {currentQuiz.questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Timer */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                        timeLeftSeconds < 60
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-surface-light text-slate-200 border-surface-border'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-primary-400" />
                      {formatTime(timeLeftSeconds)}
                    </div>

                    <Button
                      variant="glow"
                      size="sm"
                      onClick={handleSubmitQuiz}
                    >
                      Submit Quiz
                    </Button>
                  </div>
                </div>

                {/* Question Card */}
                <div className="glass-card rounded-2xl p-6 sm:p-8 border border-surface-border space-y-6">
                  {/* Question Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20">
                        {currentQ.topic}
                      </span>
                      <Badge
                        variant={
                          currentQ.difficulty.toLowerCase() === 'easy'
                            ? 'success'
                            : currentQ.difficulty.toLowerCase() === 'medium'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {currentQ.difficulty}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-400 bg-surface px-2.5 py-0.5 rounded-md border border-surface-border flex items-center gap-1">
                        <FileText className="w-3 h-3 text-accent-cyan" />
                        {currentQ.filename} (Page {currentQ.page_number})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(activeQuestionIdx)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                        flaggedQuestions.has(activeQuestionIdx)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200 border-surface-border hover:bg-surface-light'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {flaggedQuestions.has(activeQuestionIdx) ? 'Flagged' : 'Flag'}
                    </button>
                  </div>

                  {/* Question Statement */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* 4 Options */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[activeQuestionIdx] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(activeQuestionIdx, optIdx)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-primary-600/20 border-primary-500 text-white shadow-glow-primary/20'
                              : 'bg-surface-subtle/80 border-surface-border hover:bg-surface-light hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                                isSelected
                                  ? 'bg-primary-600 text-white border-primary-400'
                                  : 'bg-surface text-slate-400 border-surface-border group-hover:border-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs sm:text-sm font-medium">{opt}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-primary-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Nav Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-surface-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={activeQuestionIdx === 0}
                      onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>

                    <div className="text-xs text-slate-400">
                      {answeredCount} of {currentQuiz.questions.length} answered
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={activeQuestionIdx === currentQuiz.questions.length - 1}
                      onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Palette (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="glass-card rounded-2xl p-5 border border-surface-border space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Question Palette
                  </h4>

                  <div className="grid grid-cols-5 gap-2">
                    {currentQuiz.questions.map((_, idx) => {
                      const isCurrent = activeQuestionIdx === idx;
                      const isAnswered = userAnswers[idx] !== undefined;
                      const isFlagged = flaggedQuestions.has(idx);

                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveQuestionIdx(idx)}
                          className={`h-10 rounded-xl font-bold text-xs relative flex items-center justify-center border transition-all ${
                            isCurrent
                              ? 'ring-2 ring-primary-500 bg-primary-600/30 text-white border-primary-400'
                              : isAnswered
                              ? 'bg-primary-600/20 text-primary-300 border-primary-500/40'
                              : 'bg-surface-subtle text-slate-400 border-surface-border hover:bg-surface-light hover:text-white'
                          }`}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-surface-border/60 space-y-2 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-primary-600/30 border border-primary-500/50" /> Answered
                      </span>
                      <span className="font-semibold text-slate-300">{answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-surface-subtle border border-surface-border" /> Unanswered
                      </span>
                      <span className="font-semibold text-slate-300">
                        {currentQuiz.questions.length - answeredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40" /> Flagged
                      </span>
                      <span className="font-semibold text-slate-300">{flaggedQuestions.size}</span>
                    </div>
                  </div>
                </div>

                {/* Grounding Info Card */}
                <div className="glass-card rounded-2xl p-5 border border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-300">
                    <Sparkles className="w-4 h-4 text-accent-cyan" />
                    RAG Grounded Intelligence
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every question in this quiz is generated from authentic passage chunks in <strong>{currentQuiz.doc_name}</strong>. After submitting, you'll see verified citations pointing to specific pages.
                  </p>
                </div>
              </div>
            </div>
          ) : currentQuiz && quizCompleted ? (
            /* RESULTS SCREEN */
            <div className="space-y-6">
              {/* Score Banner */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary-500/30 text-center relative overflow-hidden shadow-glow-primary/10">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-cyan flex items-center justify-center mx-auto text-white shadow-lg shadow-primary-900/50">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Quiz Completed!
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {currentResult?.percentage && currentResult.percentage >= 70
                      ? 'Outstanding performance! You have mastered the core concepts of this section.'
                      : 'Good effort! Review the detailed question explanations below to reinforce weak areas.'}
                  </p>

                  <div className="flex items-center justify-center gap-6 py-4">
                    <div>
                      <span className="text-3xl font-extrabold text-primary-300">
                        {currentResult?.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-400 block">Accuracy</span>
                    </div>
                    <div className="w-px h-10 bg-surface-border" />
                    <div>
                      <span className="text-3xl font-extrabold text-emerald-400">
                        {currentResult?.score} / {currentResult?.total}
                      </span>
                      <span className="text-[11px] text-slate-400 block">Correct Answers</span>
                    </div>
                    <div className="w-px h-10 bg-surface-border" />
                    <div>
                      <span className="text-3xl font-extrabold text-slate-200">
                        {formatTime(currentResult?.time_taken_seconds || 0)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">Time Spent</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="glow"
                      onClick={handleRetakeQuiz}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      Retake Quiz
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowGenerator(true)}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      New Quiz from PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detailed Review with Grounded Citations */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Detailed Question Review & Citations
                </h3>

                {currentQuiz.questions.map((q, idx) => {
                  const userAns = userAnswers[idx];
                  const isCorrect = userAns === q.correct_index;

                  return (
                    <div
                      key={q.id || idx}
                      className={`glass-card rounded-2xl p-6 border transition-all ${
                        isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-light text-slate-300">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-primary-400">
                            {q.topic}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 bg-surface px-2.5 py-0.5 rounded-md border border-surface-border flex items-center gap-1">
                            <FileText className="w-3 h-3 text-accent-cyan" />
                            {q.filename} (Page {q.page_number})
                          </span>
                        </div>

                        <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                          {isCorrect ? 'Correct (+100 XP)' : 'Incorrect'}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 mb-4">
                        {q.question}
                      </h4>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAns === optIdx;
                          const isThisCorrect = optIdx === q.correct_index;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                isThisCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                                  : isSelected
                                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                                  : 'bg-surface-subtle/50 border-surface-border text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {!isThisCorrect && isSelected && (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & PDF Citation */}
                      <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <HelpCircle className="w-4 h-4 text-primary-400" />
                          Explanation:
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>

                        {/* Citation Badge */}
                        <div className="pt-2 border-t border-surface-border flex items-start gap-2 text-[11px] text-primary-300">
                          <BookOpen className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-200">Grounded in: </span>
                            <span className="text-slate-300 font-medium">{q.filename}, Page {q.page_number}</span>
                            {q.excerpt && (
                              <p className="italic text-slate-400 mt-1">"{q.excerpt}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center text-slate-400 text-xs space-y-4">
              <p>No quiz selected. Click below to generate your first practice quiz from your uploaded PDF.</p>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setShowGenerator(true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Create Quiz from PDF
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
