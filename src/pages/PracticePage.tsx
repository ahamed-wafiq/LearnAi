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
import { Link, useSearchParams } from 'react-router-dom';

export const PracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get('topic');
  const docParam = searchParams.get('doc');

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
  const [selectedDocId, setSelectedDocId] = useState<string>(docParam || '');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [topicPrompt, setTopicPrompt] = useState<string>(topicParam || '');

  // Active quiz session states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<QuizResultRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'quiz' | 'history'>('quiz');

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
        setSelectedDocId(docParam || docs[0].id);
      }

      setQuizzes(savedQuizzes);
      setPastResults(results);

      if (topicParam) {
        setTopicPrompt(topicParam);
        const matchingQuiz = savedQuizzes.find(
          (q) => q.topic.toLowerCase().includes(topicParam.toLowerCase()) ||
                 q.questions.some(qn => qn.topic.toLowerCase().includes(topicParam.toLowerCase()))
        );
        if (matchingQuiz) {
          selectQuiz(matchingQuiz);
        } else {
          setShowGenerator(true);
        }
      } else if (savedQuizzes.length > 0) {
        selectQuiz(savedQuizzes[0]);
      } else if (docs.length > 0) {
        setShowGenerator(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, [topicParam, docParam]);

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
      <div className="bg-white rounded-3xl p-10 text-center max-w-xl mx-auto space-y-5 border border-[#1E222A]/10 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#7E79D8]/10 border border-[#7E79D8]/20 flex items-center justify-center mx-auto text-[#7E79D8]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1E222A]">No Study Materials Indexed Yet</h2>
        <p className="text-sm text-slate-500">
          To generate AI-powered multiple-choice questions grounded in your course materials, please upload a PDF document first.
        </p>
        <Link to="/library">
          <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
            Go to Document Library
          </Button>
        </Link>
      </div>
    );
  }

  const currentQ: QuizQuestion | undefined = currentQuiz?.questions[activeQuestionIdx];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-4 sm:p-8 paper-dot-grid space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0C1220] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#FF4742] text-white border border-[#0C1220]">
              DRILL MODULE
            </span>
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#00E5FF] text-[#0C1220] border border-[#0C1220]">
              ACTIVE RECALL
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-[#0C1220] flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-[#FF4742]" />
            AI PRACTICE & QUESTION DRILLS
          </h2>
          <p className="font-mono text-xs text-[#53627C] mt-1">
            Multiple-choice quizzes generated directly from your uploaded course PDFs using RAG & Gemini
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-[#1E222A]/10 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quiz' ? 'bg-[#7E79D8] text-white' : 'text-slate-500 hover:text-[#1E222A]'
              }`}
            >
              Current Quiz
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#7E79D8] text-white' : 'text-slate-500 hover:text-[#1E222A]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Past Attempts ({pastResults.length})
            </button>
          </div>

          <Button
            variant="primary"
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
                  <Sparkles className="w-5 h-5 text-[#7E79D8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E222A]">Generate Quiz from Document</h3>
                  <p className="text-xs text-slate-500">Grounded in RAG chunks with page citations</p>
                </div>
              </div>
              <button
                onClick={() => !generating && setShowGenerator(false)}
                className="text-slate-400 hover:text-[#1E222A] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Document Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E222A] flex items-center justify-between">
                  <span>Source Document</span>
                  <span className="text-[11px] text-[#7E79D8]">{documents.length} PDF(s) available</span>
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={generating}
                  className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] focus:outline-none focus:border-[#7E79D8]"
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
                <label className="text-xs font-semibold text-[#1E222A]">Number of Questions</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={generating}
                      onClick={() => setNumQuestions(num)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        numQuestions === num
                          ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                          : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:bg-slate-200 hover:text-[#1E222A]'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E222A]">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      disabled={generating}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === diff
                          ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                          : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:bg-slate-200 hover:text-[#1E222A]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Prompt (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E222A]">
                  Focus Topic / Keyword <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regularization, Gradient Descent, Overfitting..."
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  disabled={generating}
                  className="w-full bg-[#F5F6FA] border border-[#1E222A]/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E222A] placeholder:text-slate-400 focus:outline-none focus:border-[#7E79D8]"
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
            <h3 className="text-base font-bold text-[#1E222A] flex items-center gap-2">
              <History className="w-5 h-5 text-primary-500" />
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
                      ? 'bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                      : 'bg-white text-slate-600 border-[#1E222A]/10 hover:text-[#1E222A] hover:bg-slate-50'
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
                    <span className="text-xs font-semibold text-slate-600">
                      Question {activeQuestionIdx + 1} of {currentQuiz.questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Timer */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                        timeLeftSeconds < 60
                          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                          : 'bg-[#F5F6FA] text-[#1E222A] border-[#1E222A]/10'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#7E79D8]" />
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
                      <span className="text-xs font-semibold text-[#7E79D8] bg-[#7E79D8]/10 px-2.5 py-1 rounded-lg border border-[#7E79D8]/20">
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
                      <span className="text-[11px] font-mono text-slate-500 bg-[#F5F6FA] px-2.5 py-0.5 rounded-md border border-[#1E222A]/10 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#06b6d4]" />
                        {currentQ.filename} (Page {currentQ.page_number})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(activeQuestionIdx)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                        flaggedQuestions.has(activeQuestionIdx)
                          ? 'bg-amber-100 text-amber-800 border-amber-300 font-medium'
                          : 'text-slate-500 hover:text-[#1E222A] border-[#1E222A]/10 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {flaggedQuestions.has(activeQuestionIdx) ? 'Flagged' : 'Flag'}
                    </button>
                  </div>

                  {/* Question Statement */}
                  <h3 className="text-base sm:text-lg font-bold text-[#1E222A] leading-relaxed">
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
                              ? 'bg-[#7E79D8]/10 border-[#7E79D8] text-[#1E222A] font-medium shadow-sm'
                              : 'bg-[#F5F6FA] border-[#1E222A]/10 hover:bg-[#F0F2F8] hover:border-[#7E79D8]/40 text-[#1E222A]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                                isSelected
                                  ? 'bg-[#7E79D8] text-white border-[#7E79D8]'
                                  : 'bg-white text-slate-600 border-[#1E222A]/10 group-hover:border-[#7E79D8]/50'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs sm:text-sm">{opt}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#7E79D8] shrink-0" />
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
                  <h4 className="text-xs font-bold text-[#1E222A] uppercase tracking-wider">
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
                              ? 'ring-2 ring-[#7E79D8] bg-[#7E79D8] text-white border-[#7E79D8] shadow-sm'
                              : isAnswered
                              ? 'bg-[#7E79D8]/15 text-[#7E79D8] font-bold border-[#7E79D8]/30'
                              : 'bg-[#F5F6FA] text-slate-600 border-[#1E222A]/10 hover:bg-slate-200 hover:text-[#1E222A]'
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

                  <div className="pt-4 border-t border-[#1E222A]/10 space-y-2 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-[#7E79D8]/20 border border-[#7E79D8]/40" /> Answered
                      </span>
                      <span className="font-semibold text-[#1E222A]">{answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-[#F5F6FA] border border-[#1E222A]/15" /> Unanswered
                      </span>
                      <span className="font-semibold text-[#1E222A]">
                        {currentQuiz.questions.length - answeredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" /> Flagged
                      </span>
                      <span className="font-semibold text-[#1E222A]">{flaggedQuestions.size}</span>
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

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E222A]">
                    Quiz Completed!
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500">
                    {currentResult?.percentage && currentResult.percentage >= 70
                      ? 'Outstanding performance! You have mastered the core concepts of this section.'
                      : 'Good effort! Review the detailed question explanations below to reinforce weak areas.'}
                  </p>

                  <div className="flex items-center justify-center gap-6 py-4">
                    <div>
                      <span className="text-3xl font-extrabold text-[#7E79D8]">
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
                <h3 className="text-base font-bold text-[#1E222A] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-[#7E79D8]">
                            {q.topic}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 bg-[#F5F6FA] px-2.5 py-0.5 rounded-md border border-[#1E222A]/10 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-[#06b6d4]" />
                            {q.filename} (Page {q.page_number})
                          </span>
                        </div>

                        <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                          {isCorrect ? 'Correct (+100 XP)' : 'Incorrect'}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-[#1E222A] mb-4">
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
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                  : isSelected
                                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                                  : 'bg-[#F8F9FD] border-[#1E222A]/10 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {!isThisCorrect && isSelected && (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & PDF Citation */}
                      <div className="p-4 rounded-xl bg-[#F5F6FA] border border-[#1E222A]/10 space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#1E222A]">
                          <HelpCircle className="w-4 h-4 text-[#7E79D8]" />
                          Explanation:
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {q.explanation}
                        </p>

                        {/* Citation Badge */}
                        <div className="pt-2 border-t border-[#1E222A]/10 flex items-start gap-2 text-[11px] text-[#7E79D8]">
                          <BookOpen className="w-3.5 h-3.5 text-[#06b6d4] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#1E222A]">Grounded in: </span>
                            <span className="text-slate-600 font-medium">{q.filename}, Page {q.page_number}</span>
                            {q.excerpt && (
                              <p className="italic text-slate-500 mt-1">"{q.excerpt}"</p>
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
