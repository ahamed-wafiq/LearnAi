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
import { Link, useSearchParams } from 'react-router-dom';

export const FlashcardsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const deckParam = searchParams.get('deck');
  const topicParam = searchParams.get('topic');

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
  const [topicPrompt, setTopicPrompt] = useState<string>(topicParam || '');

  // Study session state
  const [activeCards, setActiveCards] = useState<GeneratedFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'review' | 'known'>('all');

  useEffect(() => {
    loadInitialData();
  }, [deckParam, topicParam]);

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

      if (deckParam) {
        const found = savedDecks.find(d => d.id === deckParam);
        if (found) {
          selectDeck(found, found.cards, 'all');
          return;
        }
      }

      if (topicParam) {
        setTopicPrompt(topicParam);
        const matchingDeck = savedDecks.find(d => 
          d.title.toLowerCase().includes(topicParam.toLowerCase()) ||
          d.cards.some(c => c.topic.toLowerCase().includes(topicParam.toLowerCase()))
        );
        if (matchingDeck) {
          selectDeck(matchingDeck, matchingDeck.cards, 'all');
          return;
        } else {
          setShowGenerator(true);
        }
      }

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
      <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] p-10 text-center max-w-xl mx-auto space-y-5">
        <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center mx-auto text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="font-pixel text-xl uppercase font-bold text-[#0C1220]">No Study Materials Indexed Yet</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-sans">
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
    <div className="bg-[#FBF5E6] text-[#0C1220] min-h-[calc(100vh-140px)] p-4 sm:p-8 paper-dot-grid space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Deck Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0C1220] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#FF4742] text-white border border-[#0C1220]">
              MEMORY ENGINE
            </span>
            <span className="font-arcade text-[9px] px-2 py-0.5 bg-[#00E5FF] text-[#0C1220] border border-[#0C1220]">
              SPACED REPETITION
            </span>
          </div>
          <h2 className="font-pixel text-xl sm:text-3xl font-extrabold uppercase text-[#0C1220] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#FF4742]" />
            AI FLASHCARDS & ACTIVE RECALL
          </h2>
          <p className="font-mono text-xs text-[#53627C] mt-1">
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
        <div className="fixed inset-0 z-50 bg-[#0C1220]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg border-2 border-[#0C1220] shadow-[5px_5px_0px_#0C1220] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b-2 border-[#0C1220] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 border-2 border-[#0C1220] bg-[#FF4742]/10 flex items-center justify-center text-[#FF4742] shadow-[2px_2px_0px_#0C1220]">
                  <Sparkles className="w-5 h-5 text-[#FF4742]" />
                </div>
                <div>
                  <h3 className="font-pixel text-base font-bold uppercase text-[#0C1220]">Generate Flashcard Deck</h3>
                  <p className="font-arcade text-[10px] text-slate-500 uppercase">Extract active-recall cards from PDF chunks</p>
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
                      {doc.filename} ({doc.total_pages} pages)
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Number of Flashcards</label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={generating}
                      onClick={() => setNumCards(num)}
                      className={`py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] font-arcade text-xs uppercase font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                        numCards === num
                          ? 'bg-[#FF4742] text-white -translate-y-0.5'
                          : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
                      }`}
                    >
                      {num} Cards
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">Target Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
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

              {/* Topic Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-arcade uppercase font-bold text-[#0C1220]">
                  Focus Topic / Concept <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backpropagation, Loss Functions, CNN Architecture..."
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
              className={`px-3.5 py-2 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-xs font-arcade uppercase whitespace-nowrap transition-all flex items-center gap-2 select-none active:translate-x-[1px] active:translate-y-[1px] ${
                currentDeck?.id === deck.id
                  ? 'bg-[#FF4742] text-white -translate-y-0.5'
                  : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${currentDeck?.id === deck.id ? 'text-white' : 'text-[#00E5FF]'}`} />
              <span>{deck.title}</span>
              <span className={`text-[9px] px-1.5 py-0.5 border border-[#0C1220] font-arcade ${currentDeck?.id === deck.id ? 'bg-[#0C1220] text-white' : 'bg-[#00E5FF]/20 text-[#0C1220]'}`}>
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
              className={`px-3 py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-xs font-arcade uppercase transition-all select-none active:translate-x-[1px] active:translate-y-[1px] ${
                filterMode === 'all'
                  ? 'bg-[#0C1220] text-white'
                  : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
              }`}
            >
              All Cards ({currentDeck.cards.length})
            </button>
            <button
              onClick={() => applyFilter('review')}
              className={`px-3 py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-xs font-arcade uppercase transition-all select-none flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] ${
                filterMode === 'review'
                  ? 'bg-[#FF4742] text-white'
                  : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
              }`}
            >
              <RotateCcw className={`w-3 h-3 ${filterMode === 'review' ? 'text-white' : 'text-[#FF4742]'}`} />
              Review Again ({reviewCount})
            </button>
            <button
              onClick={() => applyFilter('known')}
              className={`px-3 py-1.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] text-xs font-arcade uppercase transition-all select-none flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] ${
                filterMode === 'known'
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#FFFDF7] text-[#0C1220] hover:bg-[#F5EDE0]'
              }`}
            >
              <CheckCircle2 className={`w-3 h-3 ${filterMode === 'known' ? 'text-white' : 'text-[#059669]'}`} />
              Known ({knownCount})
            </button>
          </div>

          <div className="font-arcade text-xs text-slate-600 uppercase">
            Mastery: <strong className="text-emerald-700 font-bold">{currentDeck.cards.length > 0 ? Math.round((knownCount / currentDeck.cards.length) * 100) : 0}%</strong>
          </div>
        </div>
      )}

      {!isCompleted && currentCard ? (
        <div className="space-y-5">
          {/* Progress Header */}
          <div className="bg-[#FFFDF7] p-4 border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{currentDeck?.doc_name || 'Study Deck'}</Badge>
              <span className="font-arcade text-xs text-[#0C1220] uppercase font-bold">
                Card {currentIndex + 1} of {activeCards.length}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
              <div className="w-full h-3 bg-[#FFFDF7] border-2 border-[#0C1220] overflow-hidden">
                <div
                  className="h-full bg-[#FF4742] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
                />
              </div>
              <span className="font-arcade text-xs text-[#0C1220] font-bold">
                {Math.round(((currentIndex + 1) / activeCards.length) * 100)}%
              </span>
            </div>
          </div>

          {/* 3D Flippable Flashcard */}
          <div className="perspective-1000 w-full min-h-[380px]">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[380px] p-8 cursor-pointer transition-all duration-500 transform-style-3d border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] flex flex-col justify-between ${
                isFlipped ? 'bg-[#FFFDF7]' : 'bg-[#FFFDF7] hover:bg-[#FFFBF2]'
              }`}
            >
              {/* FRONT OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full ${isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-arcade text-xs uppercase tracking-wider text-[#FF4742] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Front • Question / Prompt
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" size="sm">{currentCard.topic}</Badge>
                    <span className="text-[10px] font-arcade text-slate-600 bg-[#FBF5E6] px-2 py-0.5 border border-[#0C1220] flex items-center gap-1 uppercase">
                      <BookOpen className="w-3 h-3 text-[#0C1220]" />
                      {currentCard.filename} (p. {currentCard.page_number})
                    </span>
                  </div>
                </div>

                {/* Front Content */}
                <div className="py-8 text-center space-y-4">
                  <h3 className="font-pixel text-lg sm:text-xl font-bold text-[#0C1220] leading-relaxed max-w-xl mx-auto uppercase">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t-2 border-[#0C1220]/20 font-arcade uppercase">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-[#FF4742]" /> Click or press <kbd className="px-1.5 py-0.5 border border-[#0C1220] bg-[#FFFDF7] font-arcade text-[10px] text-[#0C1220]">Space</kbd> to flip
                  </span>
                  <span>Tap anywhere to reveal back</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className={`space-y-6 flex flex-col justify-between h-full ${!isFlipped ? 'hidden' : 'flex'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-arcade text-xs uppercase tracking-wider text-[#059669] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Back • Answer &amp; Citation
                  </span>
                  <span className="text-[10px] font-arcade text-slate-600 bg-[#FBF5E6] px-2 py-0.5 border border-[#0C1220] flex items-center gap-1 uppercase">
                    <FileText className="w-3 h-3 text-[#0C1220]" />
                    {currentCard.filename} (Page {currentCard.page_number})
                  </span>
                </div>

                {/* Back Content */}
                <div className="py-3 space-y-4 text-left">
                  <div className="text-sm sm:text-base text-[#0C1220] font-sans leading-relaxed bg-[#FBF5E6] p-5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]">
                    {currentCard.back}
                  </div>

                  {currentCard.excerpt && (
                    <div className="p-3.5 border-2 border-[#0C1220] shadow-[1px_1px_0px_#0C1220] bg-[#FFFDF7] text-xs">
                      <span className="font-arcade text-[10px] text-[#FF4742] uppercase font-bold">Grounded Excerpt: </span>
                      <span className="italic text-slate-700 font-sans">"{currentCard.excerpt}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t-2 border-[#0C1220]/20 font-arcade uppercase">
                  <span>Rate your recall to record progress</span>
                  <span className="text-[#FF4742] font-bold">Click a rating below</span>
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
                  className="p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] bg-[#FF4742] hover:bg-[#FF5F5B] text-white transition-all flex flex-col items-center gap-1 font-arcade uppercase active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Review Again</span>
                    <kbd className="text-[9px] px-1 bg-black/20 border border-white/20">1</kbd>
                  </div>
                  <span className="text-[9px] text-white/80">Mark Difficult</span>
                </button>

                <button
                  onClick={() => handleRateCard('review', 2)}
                  className="p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] bg-[#F8C02F] hover:bg-[#FBD060] text-[#0C1220] transition-all flex flex-col items-center gap-1 font-arcade uppercase active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Hard</span>
                    <kbd className="text-[9px] px-1 bg-black/10 border border-black/20">2</kbd>
                  </div>
                  <span className="text-[9px] text-slate-700">Needs Practice</span>
                </button>

                <button
                  onClick={() => handleRateCard('known', 3)}
                  className="p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] bg-[#00E5FF] hover:bg-[#33ECFF] text-[#0C1220] transition-all flex flex-col items-center gap-1 font-arcade uppercase active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Good</span>
                    <kbd className="text-[9px] px-1 bg-black/10 border border-black/20">3</kbd>
                  </div>
                  <span className="text-[9px] text-slate-700">Recalled</span>
                </button>

                <button
                  onClick={() => handleRateCard('known', 4)}
                  className="p-3 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] bg-[#059669] hover:bg-[#10B981] text-white transition-all flex flex-col items-center gap-1 font-arcade uppercase active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Known / Easy</span>
                    <kbd className="text-[9px] px-1 bg-black/20 border border-white/20">4</kbd>
                  </div>
                  <span className="text-[9px] text-white/80">Mastered</span>
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
        <div className="bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 border-2 border-[#0C1220] bg-[#FF4742] shadow-[2px_2px_0px_#0C1220] flex items-center justify-center mx-auto text-white">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-pixel text-2xl uppercase font-bold text-[#0C1220]">
              Flashcard Session Complete!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-md mx-auto">
              You reviewed {activeCards.length} cards from <strong className="text-[#0C1220]">{currentDeck?.title}</strong>.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center justify-center gap-6 py-3 bg-[#FBF5E6] border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] max-w-sm mx-auto">
            <div className="text-center">
              <span className="font-arcade text-2xl font-bold text-[#059669] block">{knownCount}</span>
              <span className="font-arcade text-[10px] text-slate-600 uppercase block mt-0.5">Marked Known</span>
            </div>
            <div className="w-0.5 h-8 bg-[#0C1220]" />
            <div className="text-center">
              <span className="font-arcade text-2xl font-bold text-[#FF4742] block">{reviewCount}</span>
              <span className="font-arcade text-[10px] text-slate-600 uppercase block mt-0.5">Needs Review</span>
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
