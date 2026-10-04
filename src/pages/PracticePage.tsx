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
  Zap,
  Quote,
  AlertCircle
} from 'lucide-react';
import { StudyService } from '../services/studyService';
import { Quiz, QuizQuestion, QuizResult } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const PracticePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  // Active quiz session states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(720); // 12 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quizList = await StudyService.getQuizzes();
        setQuizzes(quizList);
        if (quizList.length > 0) {
          setCurrentQuiz(quizList[0]);
          setTimeLeftSeconds(quizList[0].timeLimitMinutes * 60);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return;
    setQuizCompleted(true);
    setIsTimerRunning(false);

    let correctCount = 0;
    const topicStats: Record<string, { score: number; total: number }> = {};

    currentQuiz.questions.forEach((q, idx) => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { score: 0, total: 0 };
      }
      topicStats[q.topic].total += 1;

      if (userAnswers[idx] === q.correctIndex) {
        correctCount += 1;
        topicStats[q.topic].score += 1;
      }
    });

    const accuracy = Math.round((correctCount / currentQuiz.questions.length) * 100);
    const timeSpent = currentQuiz.timeLimitMinutes * 60 - timeLeftSeconds;

    const topicBreakdown = Object.entries(topicStats).map(([topic, stat]) => ({
      topic,
      score: stat.score,
      total: stat.total
    }));

    const result = await StudyService.submitQuizResult({
      quizId: currentQuiz.id,
      title: currentQuiz.title,
      score: correctCount,
      totalQuestions: currentQuiz.questions.length,
      accuracy,
      timeSpentSeconds: timeSpent,
      topicBreakdown,
      userAnswers
    });

    setQuizResult(result);

    // Confetti celebration if accuracy >= 70%
    if (accuracy >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // graceful ignore
      }
    }
  };

  const handleRetakeQuiz = () => {
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setActiveQuestionIdx(0);
    setQuizCompleted(false);
    setQuizResult(null);
    if (currentQuiz) {
      setTimeLeftSeconds(currentQuiz.timeLimitMinutes * 60);
      setIsTimerRunning(true);
    }
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setActiveQuestionIdx(0);
    setQuizCompleted(false);
    setQuizResult(null);
    setTimeLeftSeconds(quiz.timeLimitMinutes * 60);
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !currentQuiz) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const currentQ: QuizQuestion = currentQuiz.questions[activeQuestionIdx];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Quiz Deck Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {quizzes.map((q) => (
          <button
            key={q.id}
            onClick={() => handleSelectQuiz(q)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
              currentQuiz.id === q.id
                ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                : 'bg-surface text-slate-400 border-surface-border hover:text-white hover:bg-surface-light'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{q.title}</span>
            <Badge variant="cyan" size="sm">{q.questions.length} Qs</Badge>
          </button>
        ))}
      </div>

      {!quizCompleted ? (
        /* QUIZ ACTIVE SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Interface (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Top Bar with Timer and Progress */}
            <div className="glass-card p-4 rounded-2xl border border-surface-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="primary">{currentQuiz.subjectName}</Badge>
                <span className="text-xs font-semibold text-slate-300">
                  Question {activeQuestionIdx + 1} of {currentQuiz.questions.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                    timeLeftSeconds < 120
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
              {/* Question metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20">
                    {currentQ.topic}
                  </span>
                  <Badge
                    variant={
                      currentQ.difficulty === 'Easy'
                        ? 'success'
                        : currentQ.difficulty === 'Medium'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {currentQ.difficulty}
                  </Badge>
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

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                {currentQ.question}
              </h3>

              {/* Options */}
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

              {/* Navigation controls */}
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

          {/* Question Palette & Navigator (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-surface-border space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Question Navigation Palette
              </h4>

              {/* Grid of questions */}
              <div className="grid grid-cols-5 gap-2.5">
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

              {/* Legend */}
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

            {/* AI Hint Prompt */}
            <div className="glass-card rounded-2xl p-5 border border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-transparent space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-300">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                Adaptive Practice Engine
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                LearnSphere analyzes your answers to identify subtle misconceptions and map them back to source citations.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* QUIZ RESULTS SCREEN */
        <div className="space-y-6">
          {/* Score Header Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary-500/30 text-center relative overflow-hidden shadow-glow-primary/10">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-cyan flex items-center justify-center mx-auto text-white shadow-lg shadow-primary-900/50">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Quiz Completed!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300">
                {quizResult?.accuracy && quizResult.accuracy >= 70
                  ? 'Outstanding performance! You have mastered the core concepts of this section.'
                  : 'Good effort! Review the detailed question explanations below to reinforce weak areas.'}
              </p>

              <div className="flex items-center justify-center gap-6 py-4">
                <div>
                  <span className="text-3xl font-extrabold text-primary-300">
                    {quizResult?.accuracy}%
                  </span>
                  <span className="text-[11px] text-slate-400 block">Accuracy</span>
                </div>
                <div className="w-px h-10 bg-surface-border" />
                <div>
                  <span className="text-3xl font-extrabold text-emerald-400">
                    {quizResult?.score} / {quizResult?.totalQuestions}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Correct Answers</span>
                </div>
                <div className="w-px h-10 bg-surface-border" />
                <div>
                  <span className="text-3xl font-extrabold text-slate-200">
                    {formatTime(quizResult?.timeSpentSeconds || 0)}
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
                  onClick={() => {
                    const next = quizzes.find(q => q.id !== currentQuiz.id) || quizzes[0];
                    handleSelectQuiz(next);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next Quiz Drill
                </Button>
              </div>
            </div>
          </div>

          {/* Topic Performance Breakdown */}
          {quizResult?.topicBreakdown && (
            <div className="glass-card rounded-2xl p-6 border border-surface-border">
              <h3 className="text-sm font-bold text-slate-100 mb-4">
                Topic Breakdown & Accuracy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizResult.topicBreakdown.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                      <span>{t.topic}</span>
                      <span>{t.score}/{t.total} ({Math.round((t.score / t.total) * 100)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          t.score === t.total
                            ? 'bg-emerald-500'
                            : t.score > 0
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${(t.score / t.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review & Citations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Detailed Question Review & Citations
            </h3>

            {currentQuiz.questions.map((q, idx) => {
              const userAns = userAnswers[idx];
              const isCorrect = userAns === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className={`glass-card rounded-2xl p-6 border transition-all ${
                    isCorrect
                      ? 'border-emerald-500/30'
                      : 'border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-light text-slate-300">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-primary-400">
                        {q.topic}
                      </span>
                    </div>

                    <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
                      {isCorrect ? 'Correct (+100 XP)' : 'Incorrect'}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-4">
                    {q.question}
                  </h4>

                  {/* Options status */}
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAns === optIdx;
                      const isThisCorrect = optIdx === q.correctIndex;

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

                  {/* Explanation & Citation */}
                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <HelpCircle className="w-4 h-4 text-primary-400" />
                      Explanation:
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>

                    {q.citation && (
                      <div className="mt-3 pt-3 border-t border-surface-border flex items-start gap-2 text-[11px] text-primary-300">
                        <Quote className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-200">Citation: </span>
                          <span className="italic text-slate-300">"{q.citation.excerpt}"</span>
                          <span className="text-slate-400 ml-1">({q.citation.documentTitle}, Page {q.citation.pageNumber})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
