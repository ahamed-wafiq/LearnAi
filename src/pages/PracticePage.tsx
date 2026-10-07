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
      <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center max-w-xl mx-auto space-y-5">
        <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center mx-auto text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="font-pixel text-xl uppercase font-bold text-[#0C1220]">No Study Materials Indexed Yet</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-sans">
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
          <div className="flex border-2 border-[#0C1220] bg-[#FFFDF7] shadow-[2px_2px_0px_#0C1220] p-0.5">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 font-arcade text-xs uppercase font-bold transition-all ${
                activeTab === 'quiz' ? 'bg-[#FF4742] text-white' : 'text-[#0C1220] hover:bg-[#F5EDE0]'
              }`}
            >
              Current Quiz
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 font-arcade text-xs uppercase font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#FF4742] text-white' : 'text-[#0C1220] hover:bg-[#F5EDE0]'
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
        <div className="fixed inset-0 z-50 bg-[#0C1220]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg border-2 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
                  <Sparkles className="w-5 h-5 text-[#FF4742]" />
                </div>
                <div>
                  <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220]">Generate Quiz from Document</h3>
                  <p className="font-arcade text-[10px] text-slate-500 uppercase">Grounded in RAG chunks with page citations</p>
                </div>
              </div>
              <button
                onClick={() => !generating && setShowGenerator(false)}
                className="text-[#0C1220] hover:text-[#FF4742] text-xl font-bold font-arcade"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Document Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220] flex items-center justify-between">
                  <span>Source Document</span>
                  <span className="text-[10px] text-[#FF4742]">{documents.length} PDF(s) available</span>
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={generating}
                  className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans focus:outline-none"
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
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Number of Questions</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={generating}
                      onClick={() => setNumQuestions(num)}
                      className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                        numQuestions === num
                          ? 'bg-[#FF4742] text-white -translate-y-0.5'
                          : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      disabled={generating}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                        difficulty === diff
                          ? 'bg-[#FF4742] text-white -translate-y-0.5'
                          : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Prompt (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">
                  Focus Topic / Keyword <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regularization, Gradient Descent, Overfitting..."
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  disabled={generating}
                  className="w-full bg-white border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] px-3.5 py-2.5 text-xs text-[#0C1220] font-sans placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#0C1220]">
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
                  className={`px-3.5 py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-xs font-arcade uppercase whitespace-nowrap transition-all flex items-center gap-2 select-none active:translate-x-[1px] active:translate-y-[1px] ${
                    currentQuiz?.id === q.id
                      ? 'bg-[#FF4742] text-white -translate-y-0.5'
                      : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${currentQuiz?.id === q.id ? 'text-white' : 'text-[#00E5FF]'}`} />
                  <span>{q.topic || q.doc_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 border border-[#0C1220] font-arcade ${currentQuiz?.id === q.id ? 'bg-[#0C1220] text-white' : 'bg-[#00E5FF]/20 text-[#0C1220]'}`}>
                    {q.questions.length} Qs
                  </span>
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
                <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="primary">{currentQuiz.doc_name}</Badge>
                    <span className="font-arcade text-xs text-[#0C1220] uppercase font-bold">
                      Question {activeQuestionIdx + 1} of {currentQuiz.questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Timer */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 border-2 border-[#0C1220] text-xs font-arcade font-bold shadow-[1px_1px_0px_#0C1220] ${
                        timeLeftSeconds < 60
                          ? 'bg-[#FF4742] text-white animate-pulse'
                          : 'bg-[#FFFDF7] text-[#0C1220]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#FF4742]" />
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
                <div className="bg-[#FFFDF7] p-6 sm:p-8 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] space-y-6">
                  {/* Question Metadata */}
                  <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-arcade text-xs text-[#0C1220] bg-[#00E5FF]/20 px-2.5 py-1 border border-[#0C1220] uppercase font-bold">
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
                      <span className="text-[10px] font-arcade text-slate-600 bg-[#FBF5E6] px-2.5 py-0.5 border border-[#0C1220] flex items-center gap-1 uppercase">
                        <FileText className="w-3 h-3 text-[#00E5FF]" />
                        {currentQ.filename} (Page {currentQ.page_number})
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(activeQuestionIdx)}
                      className={`flex items-center gap-1.5 text-xs font-arcade uppercase px-2.5 py-1 border-2 border-[#0C1220] shadow-[1px_1px_0px_#0C1220] transition-colors ${
                        flaggedQuestions.has(activeQuestionIdx)
                          ? 'bg-[#F8C02F] text-[#0C1220] font-bold'
                          : 'bg-[#FFFDF7] text-slate-600 hover:text-[#0C1220] hover:bg-[#F5EDE0]'
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
                          className={`w-full text-left p-4 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] transition-all flex items-center justify-between group active:translate-x-[1px] active:translate-y-[1px] ${
                            isSelected
                              ? 'bg-[#00E5FF]/20 border-[#0C1220] text-[#0C1220] font-medium'
                              : 'bg-[#FFFDF7] hover:bg-[#F5EDE0] text-[#0C1220]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 border-2 border-[#0C1220] flex items-center justify-center text-xs font-arcade uppercase font-bold transition-colors ${
                                isSelected
                                  ? 'bg-[#FF4742] text-white'
                                  : 'bg-[#FFFDF7] text-[#0C1220]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-xs sm:text-sm font-sans font-medium text-[#0C1220]">{opt}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#FF4742] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Nav Controls */}
                  <div className="flex items-center justify-between pt-6 border-t-2 border-[#0C1220]/20">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={activeQuestionIdx === 0}
                      onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>

                    <div className="font-arcade text-xs text-slate-500 uppercase">
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
                <div className="bg-[#FFFDF7] p-5 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] space-y-4">
                  <h4 className="font-arcade text-xs font-bold text-[#0C1220] uppercase tracking-wider">
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
                          className={`h-10 border-2 border-[#0C1220] font-arcade text-xs relative flex items-center justify-center transition-all select-none active:translate-x-[1px] active:translate-y-[1px] ${
                            isCurrent
                              ? 'bg-[#FF4742] text-white shadow-[2px_2px_0px_#0C1220] -translate-y-0.5'
                              : isAnswered
                              ? 'bg-[#00E5FF]/20 text-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-bold'
                              : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0] shadow-[2px_2px_0px_#0C1220]'
                          }`}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="w-2 h-2 bg-[#F8C02F] border border-[#0C1220] absolute top-1 right-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t-2 border-[#0C1220]/20 space-y-2 text-xs font-arcade uppercase text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-[#0C1220] bg-[#00E5FF]/30" /> Answered
                      </span>
                      <span className="font-bold text-[#0C1220]">{answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-[#0C1220] bg-[#FFFDF7]" /> Unanswered
                      </span>
                      <span className="font-bold text-[#0C1220]">
                        {currentQuiz.questions.length - answeredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-[#0C1220] bg-[#F8C02F]" /> Flagged
                      </span>
                      <span className="font-bold text-[#0C1220]">{flaggedQuestions.size}</span>
                    </div>
                  </div>
                </div>

                {/* Grounding Info Card */}
                <div className="bg-[#FFFDF7] p-5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] space-y-2">
                  <div className="flex items-center gap-2 font-arcade text-xs font-bold text-[#0C1220] uppercase">
                    <Sparkles className="w-4 h-4 text-[#FF4742]" />
                    RAG Grounded Intelligence
                  </div>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    Every question in this quiz is generated from authentic passage chunks in <strong className="text-[#0C1220]">{currentQuiz.doc_name}</strong>. After submitting, you'll see verified citations pointing to specific pages.
                  </p>
                </div>
              </div>
            </div>
          ) : currentQuiz && quizCompleted ? (
            /* RESULTS SCREEN */
            <div className="space-y-6">
              {/* Score Banner */}
              <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center mx-auto text-white">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <h2 className="font-pixel text-2xl sm:text-3xl font-extrabold uppercase text-[#0C1220]">
                    Quiz Completed!
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 font-sans">
                    {currentResult?.percentage && currentResult.percentage >= 70
                      ? 'Outstanding performance! You have mastered the core concepts of this section.'
                      : 'Good effort! Review the detailed question explanations below to reinforce weak areas.'}
                  </p>

                  <div className="flex items-center justify-center gap-6 py-4 bg-[#FBF5E6] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
                    <div>
                      <span className="font-arcade text-3xl font-bold text-[#FF4742]">
                        {currentResult?.percentage}%
                      </span>
                      <span className="font-arcade text-[10px] text-slate-600 uppercase block mt-1">Accuracy</span>
                    </div>
                    <div className="w-0.5 h-10 bg-[#0C1220]" />
                    <div>
                      <span className="font-arcade text-3xl font-bold text-[#059669]">
                        {currentResult?.score} / {currentResult?.total}
                      </span>
                      <span className="font-arcade text-[10px] text-slate-600 uppercase block mt-1">Correct</span>
                    </div>
                    <div className="w-0.5 h-10 bg-[#0C1220]" />
                    <div>
                      <span className="font-arcade text-3xl font-bold text-[#0C1220]">
                        {formatTime(currentResult?.time_taken_seconds || 0)}
                      </span>
                      <span className="font-arcade text-[10px] text-slate-600 uppercase block mt-1">Time Spent</span>
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
                <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  Detailed Question Review & Citations
                </h3>

                {currentQuiz.questions.map((q, idx) => {
                  const userAns = userAnswers[idx];
                  const isCorrect = userAns === q.correct_index;

                  return (
                    <div
                      key={q.id || idx}
                      className={`bg-[#FFFDF7] p-6 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] transition-all space-y-4`}
                    >
                      <div className="flex items-start justify-between gap-4 border-b-2 border-[#0C1220] pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-arcade text-xs font-bold px-2 py-0.5 border border-[#0C1220] bg-[#FFFDF7] text-[#0C1220]">
                            Q{idx + 1}
                          </span>
                          <span className="font-arcade text-xs text-[#0C1220] bg-[#00E5FF]/20 px-2 py-0.5 border border-[#0C1220] uppercase font-bold">
                            {q.topic}
                          </span>
                          <span className="text-[10px] font-arcade text-slate-600 bg-[#FBF5E6] px-2.5 py-0.5 border border-[#0C1220] flex items-center gap-1 uppercase">
                            <FileText className="w-3 h-3 text-[#00E5FF]" />
                            {q.filename} (Page {q.page_number})
                          </span>
                        </div>

                        <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                          {isCorrect ? 'Correct (+100 XP)' : 'Incorrect'}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-[#0C1220]">
                        {q.question}
                      </h4>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAns === optIdx;
                          const isThisCorrect = optIdx === q.correct_index;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 border-2 border-[#0C1220] text-xs flex items-center justify-between ${
                                isThisCorrect
                                  ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-[1px_1px_0px_#0C1220]'
                                  : isSelected
                                  ? 'bg-rose-50 text-rose-900 shadow-[1px_1px_0px_#0C1220]'
                                  : 'bg-[#FFFDF7] text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-arcade font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                <span className="font-sans">{opt}</span>
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
                      <div className="p-4 bg-[#FBF5E6] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-arcade text-xs uppercase font-bold text-[#0C1220]">
                          <HelpCircle className="w-4 h-4 text-[#FF4742]" />
                          Explanation:
                        </div>
                        <p className="text-slate-700 font-sans leading-relaxed">
                          {q.explanation}
                        </p>

                        {/* Citation Badge */}
                        <div className="pt-2 border-t border-[#0C1220]/20 flex items-start gap-2 text-[11px]">
                          <BookOpen className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-arcade uppercase font-bold text-[#0C1220]">Grounded in: </span>
                            <span className="text-slate-700 font-medium">{q.filename}, Page {q.page_number}</span>
                            {q.excerpt && (
                              <p className="italic text-slate-600 mt-1 font-sans">"{q.excerpt}"</p>
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
            <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center text-slate-500 text-xs space-y-4">
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
