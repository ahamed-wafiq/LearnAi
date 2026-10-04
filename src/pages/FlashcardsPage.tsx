import React, { useEffect, useState } from 'react';
import {
  Layers,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Trophy,
  Filter,
  Bookmark
} from 'lucide-react';
import { StudyService } from '../services/studyService';
import { FlashcardDeck, Flashcard } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const FlashcardsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deckList = await StudyService.getFlashcardDecks();
        setDecks(deckList);
        if (deckList.length > 0) {
          setCurrentDeck(deckList[0]);
          const cardList = await StudyService.getFlashcardsByDeckId(deckList[0].id);
          setCards(cardList);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard('again');
        else if (e.key === '2') handleRateCard('hard');
        else if (e.key === '3') handleRateCard('good');
        else if (e.key === '4') handleRateCard('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, cards]);

  const handleSelectDeck = async (deck: FlashcardDeck) => {
    setCurrentDeck(deck);
    setLoading(true);
    try {
      const cardList = await StudyService.getFlashcardsByDeckId(deck.id);
      setCards(cardList);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
      setSessionReviewedCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setSessionReviewedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setIsCompleted(true);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionReviewedCount(0);
  };

  if (loading || !currentDeck) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Banner & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary-400" />
            Spaced Repetition Flashcards
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Leitner interval system optimizing active recall before knowledge decay
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShuffle}
            leftIcon={<Shuffle className="w-3.5 h-3.5" />}
          >
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartSession}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Deck Selector Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {decks.map((deck) => (
          <button
            key={deck.id}
            onClick={() => handleSelectDeck(deck)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2.5 ${
              currentDeck.id === deck.id
                ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                : 'bg-surface text-slate-300 border-surface-border hover:bg-surface-light hover:text-white'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: deck.color }}
            />
            <span>{deck.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
              {deck.dueTodayCount} due
            </span>
          </button>
        ))}
      </div>

      {!isCompleted && currentCard ? (
        <div className="space-y-5">
          {/* Progress Bar & Header */}
          <div className="glass-card p-4 rounded-2xl border border-surface-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{currentDeck.subjectName}</Badge>
              <span className="text-xs font-semibold text-slate-300">
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(((currentIndex + 1) / cards.length) * 100)}%
              </span>
            </div>
          </div>

          {/* 3D Flippable Flashcard Canvas */}
          <div className="perspective-1000 w-full min-h-[380px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[380px] rounded-3xl p-8 cursor-pointer transition-transform duration-500 transform-style-3d glass-card border border-primary-500/20 shadow-2xl flex flex-col justify-between ${
                isFlipped ? 'rotate-y-180 bg-surface-light/90 border-primary-500/50' : 'hover:border-primary-500/40'
              }`}
            >
              {/* FRONT OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full backface-hidden ${isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-primary-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Front • Question
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-subtle text-slate-400 border border-surface-border">
                      Leitner Box {currentCard.repetitionLevel}
                    </span>
                    <Badge variant="cyan" size="sm">{currentCard.difficulty}</Badge>
                  </div>
                </div>

                {/* Question */}
                <div className="py-6 text-center space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-relaxed max-w-xl mx-auto">
                    {currentCard.question}
                  </h3>
                  {currentCard.tags && (
                    <div className="flex justify-center gap-1.5">
                      {currentCard.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] text-slate-400 bg-surface px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-surface-border/60">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-primary-400" /> Click or press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-surface-border font-mono text-[10px] text-slate-300">Space</kbd> to flip
                  </span>
                  <span className="text-slate-500">Tap anywhere</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full backface-hidden rotate-y-180 ${!isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Back • Answer & Explanation
                  </span>
                  <Badge variant="success" size="sm">Verified Answer</Badge>
                </div>

                {/* Answer Content */}
                <div className="py-2 space-y-4 text-left">
                  <div className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line bg-surface/60 p-5 rounded-2xl border border-surface-border">
                    {currentCard.answer}
                  </div>

                  {currentCard.formula && (
                    <div className="p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/25 text-center font-mono text-sm text-primary-200">
                      {currentCard.formula}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-surface-border/60">
                  <span>Rate your recall to schedule next interval</span>
                  <span className="text-primary-400 font-medium">Use keys 1 - 4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leitner Spaced Repetition Controls */}
          {isFlipped ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => handleRateCard('again')}
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex flex-col items-center gap-1 group"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>Again</span>
                  <kbd className="text-[10px] font-mono px-1 rounded bg-rose-500/20 border border-rose-500/30">1</kbd>
                </div>
                <span className="text-[10px] text-rose-400/80">&lt; 1 min</span>
              </button>

              <button
                onClick={() => handleRateCard('hard')}
                className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex flex-col items-center gap-1 group"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>Hard</span>
                  <kbd className="text-[10px] font-mono px-1 rounded bg-amber-500/20 border border-amber-500/30">2</kbd>
                </div>
                <span className="text-[10px] text-amber-400/80">12 hours</span>
              </button>

              <button
                onClick={() => handleRateCard('good')}
                className="p-3.5 rounded-2xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-300 transition-all flex flex-col items-center gap-1 group"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>Good</span>
                  <kbd className="text-[10px] font-mono px-1 rounded bg-primary-500/20 border border-primary-500/30">3</kbd>
                </div>
                <span className="text-[10px] text-primary-400/80">1 day</span>
              </button>

              <button
                onClick={() => handleRateCard('easy')}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all flex flex-col items-center gap-1 group"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>Easy</span>
                  <kbd className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 border border-emerald-500/30">4</kbd>
                </div>
                <span className="text-[10px] text-emerald-400/80">4 days</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Button
                variant="glow"
                size="lg"
                onClick={() => setIsFlipped(true)}
                leftIcon={<RotateCw className="w-4 h-4" />}
              >
                Flip to Reveal Answer (Space)
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* DECK COMPLETED SCREEN */
        <div className="glass-card rounded-3xl p-8 text-center border border-primary-500/30 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-accent-cyan flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-950">
            <Trophy className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-extrabold text-white">
            Deck Review Completed!
          </h3>

          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You reviewed all {cards.length} cards in <strong>{currentDeck.title}</strong>. Your spaced repetition intervals have been recalculated.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="glow"
              onClick={handleRestartSession}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Review Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const next = decks.find(d => d.id !== currentDeck.id) || decks[0];
                handleSelectDeck(next);
              }}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next Deck
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
