import React, { useEffect, useState } from 'react';
import {
  Layers,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Trophy,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  BookOpen,
  Bookmark,
  PlusCircle,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import {
  listDocuments,
  generateFlashcards,
  listFlashcardDecks,
  saveFlashcardProgress,
  getFlashcardProgress,
  RAGDocument,
  GeneratedFlashcardDeck,
  GeneratedFlashcard,
  FlashcardProgress
} from '../services/ragApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';

export const FlashcardsPage: React.FC = () => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [decks, setDecks] = useState<GeneratedFlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<GeneratedFlashcardDeck | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, FlashcardProgress>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deck generation form state
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [numCards, setNumCards] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [topicPrompt, setTopicPrompt] = useState<string>('');

  // Study session state
  const [activeCards, setActiveCards] = useState<GeneratedFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'review' | 'known'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, savedDecks, progress] = await Promise.all([
        listDocuments().catch(() => []),
        listFlashcardDecks().catch(() => []),
        getFlashcardProgress().catch(() => ({}))
      ]);

      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }

      setDecks(savedDecks);
      setProgressMap(progress);

      if (savedDecks.length > 0) {
        selectDeck(savedDecks[0], savedDecks[0].cards, 'all');
      } else if (docs.length > 0) {
        setShowGenerator(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load flashcard resources.');
    } finally {
      setLoading(false);
    }
  };

  const selectDeck = (deck: GeneratedFlashcardDeck, cardPool?: GeneratedFlashcard[], mode: 'all' | 'review' | 'known' = 'all') => {
    setCurrentDeck(deck);
    setFilterMode(mode);
    const pool = cardPool || deck.cards;
    setActiveCards(pool);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const applyFilter = (mode: 'all' | 'review' | 'known') => {
    if (!currentDeck) return;
    setFilterMode(mode);
    let filtered = currentDeck.cards;

    if (mode === 'review') {
      filtered = currentDeck.cards.filter(c => progressMap[c.id]?.status === 'review');
    } else if (mode === 'known') {
      filtered = currentDeck.cards.filter(c => progressMap[c.id]?.status === 'known');
    }

    if (filtered.length === 0) {
      filtered = currentDeck.cards;
      setFilterMode('all');
    }

    setActiveCards(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard('review', 1);
        else if (e.key === '2') handleRateCard('review', 2);
        else if (e.key === '3') handleRateCard('known', 3);
        else if (e.key === '4') handleRateCard('known', 4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, activeCards]);

  const handleGenerateDeck = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one PDF in the Library first.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const newDeck = await generateFlashcards({
        docId: selectedDocId || undefined,
        numCards,
        difficulty,
        topic: topicPrompt.trim() || undefined,
      });

      setDecks(prev => [newDeck, ...prev]);
      setShowGenerator(false);
      selectDeck(newDeck, newDeck.cards, 'all');
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards. Please check Gemini API connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRateCard = async (status: 'known' | 'review', rating: number) => {
    if (!currentDeck || activeCards.length === 0) return;
    const card = activeCards[currentIndex];

    // Optimistically update local progress map
    const updatedProgress: FlashcardProgress = {
      card_id: card.id,
      deck_id: currentDeck.id,
      status,
      rating,
      reviews_count: (progressMap[card.id]?.reviews_count || 0) + 1,
      last_reviewed_at: Date.now() / 1000,
    };

    setProgressMap(prev => ({ ...prev, [card.id]: updatedProgress }));

    // Persist to backend
    try {
      await saveFlashcardProgress({
        card_id: card.id,
        deck_id: currentDeck.id,
        status,
        rating,
      });
    } catch (e) {
      // Local fallback
    }

    setIsFlipped(false);

    if (currentIndex < activeCards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setIsCompleted(true);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...activeCards].sort(() => Math.random() - 0.5);
    setActiveCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  const handleRevisitDifficult = () => {
    if (!currentDeck) return;
    const difficult = currentDeck.cards.filter(c => progressMap[c.id]?.status === 'review');
    if (difficult.length > 0) {
      setActiveCards(difficult);
      setFilterMode('review');
    } else {
      setActiveCards(currentDeck.cards);
      setFilterMode('all');
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
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
          To generate active-recall flashcards grounded in your course materials, please upload a PDF document first.
        </p>
        <Link to="/library">
          <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
            Go to Document Library
          </Button>
        </Link>
      </div>
    );
  }

  const currentCard = activeCards[currentIndex];
  const knownCount = currentDeck ? currentDeck.cards.filter(c => progressMap[c.id]?.status === 'known').length : 0;
  const reviewCount = currentDeck ? currentDeck.cards.filter(c => progressMap[c.id]?.status === 'review').length : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Banner & Deck Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E222A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#7E79D8]" />
            AI Flashcards & Active Recall
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Self-paced spaced repetition flashcards extracted from your uploaded PDFs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShuffle}
            disabled={activeCards.length === 0}
            leftIcon={<Shuffle className="w-3.5 h-3.5" />}
          >
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartSession}
            disabled={activeCards.length === 0}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button
            variant="glow"
            size="sm"
            onClick={() => setShowGenerator(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Create Deck
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
                  <h3 className="text-base font-bold text-white">Generate Flashcard Deck</h3>
                  <p className="text-xs text-slate-400">Extract active-recall cards from PDF chunks</p>
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
                      {doc.filename} ({doc.total_pages} pages)
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Number of Flashcards</label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={generating}
                      onClick={() => setNumCards(num)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        numCards === num
                          ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                          : 'bg-surface-subtle text-slate-400 border-surface-border hover:bg-surface-light'
                      }`}
                    >
                      {num} Cards
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">Target Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      disabled={generating}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
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

              {/* Topic Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Focus Topic / Concept <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backpropagation, Loss Functions, CNN Architecture..."
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
                onClick={handleGenerateDeck}
                leftIcon={generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {generating ? 'Extracting Cards...' : 'Generate with Gemini'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Selector Tabs */}
      {decks.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => selectDeck(deck, deck.cards, 'all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2.5 ${
                currentDeck?.id === deck.id
                  ? 'bg-primary-600 text-white border-primary-500 shadow-glow-primary'
                  : 'bg-surface text-slate-300 border-surface-border hover:bg-surface-light hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-accent-cyan" />
              <span>{deck.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                {deck.cards.length} cards
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filtering Pills: All / Needs Review / Known */}
      {currentDeck && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterMode === 'all'
                  ? 'bg-primary-600 text-white border-primary-500'
                  : 'bg-surface-subtle text-slate-400 border-surface-border hover:text-white'
              }`}
            >
              All Cards ({currentDeck.cards.length})
            </button>
            <button
              onClick={() => applyFilter('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                filterMode === 'review'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-surface-subtle text-slate-400 border-surface-border hover:text-white'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              Review Again ({reviewCount})
            </button>
            <button
              onClick={() => applyFilter('known')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                filterMode === 'known'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-surface-subtle text-slate-400 border-surface-border hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Known ({knownCount})
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Mastery: <strong className="text-emerald-400">{currentDeck.cards.length > 0 ? Math.round((knownCount / currentDeck.cards.length) * 100) : 0}%</strong>
          </div>
        </div>
      )}

      {!isCompleted && currentCard ? (
        <div className="space-y-5">
          {/* Progress Header */}
          <div className="glass-card p-4 rounded-2xl border border-surface-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{currentDeck?.doc_name || 'Study Deck'}</Badge>
              <span className="text-xs font-semibold text-slate-300">
                Card {currentIndex + 1} of {activeCards.length}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(((currentIndex + 1) / activeCards.length) * 100)}%
              </span>
            </div>
          </div>

          {/* 3D Flippable Flashcard */}
          <div className="perspective-1000 w-full min-h-[380px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[380px] rounded-3xl p-8 cursor-pointer transition-all duration-500 transform-style-3d glass-card border border-primary-500/20 shadow-2xl flex flex-col justify-between ${
                isFlipped ? 'bg-surface-light/95 border-primary-500/50' : 'hover:border-primary-500/40'
              }`}
            >
              {/* FRONT OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full ${isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-primary-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Front • Question / Prompt
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" size="sm">{currentCard.topic}</Badge>
                    <span className="text-[11px] font-mono text-slate-400 bg-surface px-2 py-0.5 rounded border border-surface-border flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-accent-cyan" />
                      {currentCard.filename} (p. {currentCard.page_number})
                    </span>
                  </div>
                </div>

                {/* Front Content */}
                <div className="py-8 text-center space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E222A] leading-relaxed max-w-xl mx-auto">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-surface-border/60">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-primary-400" /> Click or press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-surface-border font-mono text-[10px] text-slate-600">Space</kbd> to flip
                  </span>
                  <span className="text-slate-500">Tap anywhere to reveal back</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full ${!isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Back • Answer & Citation
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 bg-surface px-2 py-0.5 rounded border border-surface-border flex items-center gap-1">
                    <FileText className="w-3 h-3 text-accent-cyan" />
                    {currentCard.filename} (Page {currentCard.page_number})
                  </span>
                </div>

                {/* Back Content */}
                <div className="py-3 space-y-4 text-left">
                  <div className="text-sm sm:text-base text-[#1E222A] font-medium leading-relaxed bg-[#F5F6FA] p-5 rounded-2xl border border-[#1E222A]/10">
                    {currentCard.back}
                  </div>

                  {currentCard.excerpt && (
                    <div className="p-3.5 rounded-xl bg-[#7E79D8]/10 border border-[#7E79D8]/20 text-xs text-[#5B54BD]">
                      <span className="font-bold text-[#1E222A]">Grounded Excerpt: </span>
                      <span className="italic text-slate-600">"{currentCard.excerpt}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-surface-border/60">
                  <span>Rate your recall to record progress</span>
                  <span className="text-primary-400 font-medium">Click a rating below</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mastery & Spaced Repetition Buttons */}
          {isFlipped ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleRateCard('review', 1)}
                  className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Review Again</span>
                    <kbd className="text-[10px] font-mono px-1 rounded bg-rose-500/20">1</kbd>
                  </div>
                  <span className="text-[10px] text-rose-400/80">Mark Difficult</span>
                </button>

                <button
                  onClick={() => handleRateCard('review', 2)}
                  className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Hard</span>
                    <kbd className="text-[10px] font-mono px-1 rounded bg-amber-500/20">2</kbd>
                  </div>
                  <span className="text-[10px] text-amber-400/80">Needs Practice</span>
                </button>

                <button
                  onClick={() => handleRateCard('known', 3)}
                  className="p-3.5 rounded-2xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-300 transition-all flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Good</span>
                    <kbd className="text-[10px] font-mono px-1 rounded bg-primary-500/20">3</kbd>
                  </div>
                  <span className="text-[10px] text-primary-400/80">Recalled</span>
                </button>

                <button
                  onClick={() => handleRateCard('known', 4)}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Known / Easy</span>
                    <kbd className="text-[10px] font-mono px-1 rounded bg-emerald-500/20">4</kbd>
                  </div>
                  <span className="text-[10px] text-emerald-400/80">Mastered</span>
                </button>
              </div>
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
      ) : isCompleted ? (
        /* DECK COMPLETED SCREEN */
        <div className="glass-card rounded-3xl p-8 text-center border border-primary-500/30 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-accent-cyan flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-950">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white">
              Flashcard Session Complete!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              You reviewed {activeCards.length} cards from <strong>{currentDeck?.title}</strong>.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center">
              <span className="text-2xl font-extrabold text-emerald-400">{knownCount}</span>
              <span className="text-xs text-slate-400 block">Marked Known</span>
            </div>
            <div className="w-px h-8 bg-surface-border" />
            <div className="text-center">
              <span className="text-2xl font-extrabold text-amber-400">{reviewCount}</span>
              <span className="text-xs text-slate-400 block">Needs Review</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {reviewCount > 0 && (
              <Button
                variant="glow"
                onClick={handleRevisitDifficult}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Revisit Difficult Cards ({reviewCount})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleRestartSession}
              leftIcon={<RotateCw className="w-4 h-4" />}
            >
              Review All Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowGenerator(true)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Generate New Deck
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center text-slate-400 text-xs space-y-4">
          <p>No cards available for the current filter. Click below to generate flashcards from your PDF.</p>
          <Button
            variant="glow"
            size="sm"
            onClick={() => setShowGenerator(true)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Create Flashcards from PDF
          </Button>
        </div>
      )}
    </div>
  );
};
