/**
 * LearnSphere RAG API Client
 * 
 * Connects the React frontend to the FastAPI RAG backend.
 * All calls go through http://localhost:8000/api
 */

const API_BASE = 'http://localhost:8000/api';

// ── Types ─────────────────────────────────────────────────────────────

export interface RAGDocument {
  id: string;
  filename: string;
  file_size_mb: number;
  total_pages: number;
  non_empty_pages: number;
  chunks_count: number;
  upload_time: string;
  status: string;
}

export interface RAGCitation {
  filename: string;
  page_number: number;
  excerpt: string;
}

export interface RAGAskResponse {
  answer: string;
  citations: RAGCitation[];
  key_takeaways: string[];
  follow_up_questions: string[];
}

export interface RAGUploadResult {
  message: string;
  document: RAGDocument;
  processing: {
    pages_extracted: number;
    chunks_created: number;
    vectors_added: number;
    embedding_time_sec: number;
  };
}

export interface RAGHealthResponse {
  status: string;
  documents_count: number;
  index: {
    total_vectors: number;
    total_chunks: number;
    total_documents: number;
  };
  gemini_configured: boolean;
}

// ── API calls ─────────────────────────────────────────────────────────

/** Check backend health and index stats */
export async function checkHealth(): Promise<RAGHealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend is not reachable');
  return res.json();
}

/** Upload a PDF file to the RAG backend */
export async function uploadPDF(
  file: File,
  onProgress?: (pct: number) => void
): Promise<RAGUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errDetail = 'Upload failed';
          try {
            const errBody = JSON.parse(xhr.responseText);
            errDetail = errBody.detail || errBody.message || errDetail;
          } catch {
            errDetail = xhr.statusText || errDetail;
          }
          reject(new Error(errDetail));
        }
      } catch (err: any) {
        reject(new Error(`Failed to parse upload response: ${err.message}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Is backend running at http://localhost:8000?'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

/** List all indexed documents */
export async function listDocuments(): Promise<RAGDocument[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    let msg = 'Failed to fetch documents';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  return data.documents;
}

/** Delete a document from the index */
export async function deleteDocument(docId: string): Promise<{ message: string; chunks_removed: number }> {
  const res = await fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' });
  if (!res.ok) {
    let msg = 'Delete failed';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** Ask a question using RAG */
export async function askQuestion(
  question: string,
  docId?: string
): Promise<RAGAskResponse> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, doc_id: docId || null }),
  });

  if (!res.ok) {
    let msg = 'Failed to get answer';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      msg = `Server returned ${res.status}: ${res.statusText}`;
    }
    throw new Error(msg);
  }

  return res.json();
}

/** Get the URL for rendering a specific PDF page as an image */
export function getDocumentPageImageUrl(docId: string, pageNumber: number, dpi: number = 150): string {
  return `${API_BASE}/documents/${encodeURIComponent(docId)}/page/${pageNumber}?dpi=${dpi}`;
}

/** Fetch extracted text for a specific PDF page */
export async function getDocumentPageText(
  docId: string,
  pageNumber: number
): Promise<{ page_number: number; text: string }> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(docId)}/page/${pageNumber}/text`);
  if (!res.ok) {
    throw new Error(`Failed to load page ${pageNumber} text`);
  }
  return res.json();
}

/** Get URL to open or download the original PDF */
export function getDocumentPdfUrl(docId: string): string {
  return `${API_BASE}/documents/${encodeURIComponent(docId)}/pdf`;
}

// ── Practice & Flashcards Types & Methods ────────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
  difficulty: string;
  filename: string;
  page_number: number;
  excerpt?: string;
}

export interface GeneratedQuiz {
  id: string;
  doc_id?: string | null;
  doc_name: string;
  difficulty: string;
  topic: string;
  questions: QuizQuestion[];
  total_questions: number;
  created_at: number;
}

export interface QuizResultRecord {
  id: string;
  quiz_id: string;
  doc_id?: string | null;
  doc_name: string;
  score: number;
  total: number;
  percentage: number;
  time_taken_seconds: number;
  user_answers: Record<string, number>;
  questions: QuizQuestion[];
  completed_at: number;
}

export interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  difficulty: string;
  filename: string;
  page_number: number;
  excerpt?: string;
}

export interface GeneratedFlashcardDeck {
  id: string;
  doc_id?: string | null;
  doc_name: string;
  title: string;
  difficulty: string;
  cards: GeneratedFlashcard[];
  total_cards: number;
  created_at: number;
}

export interface FlashcardProgress {
  card_id: string;
  deck_id: string;
  status: 'known' | 'review' | 'unreviewed';
  rating?: number | null;
  reviews_count: number;
  last_reviewed_at?: number;
}

/** Generate a quiz with MCQs using RAG and Gemini */
export async function generateQuiz(options: {
  docId?: string;
  numQuestions?: number;
  difficulty?: string;
  topic?: string;
}): Promise<GeneratedQuiz> {
  const res = await fetch(`${API_BASE}/practice/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doc_id: options.docId || null,
      num_questions: options.numQuestions || 5,
      difficulty: options.difficulty || 'Medium',
      topic: options.topic || null,
    }),
  });

  if (!res.ok) {
    let msg = 'Failed to generate quiz';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      msg = `Server error ${res.status}: ${res.statusText}`;
    }
    throw new Error(msg);
  }

  return res.json();
}

/** Get list of saved quizzes */
export async function listQuizzes(docId?: string): Promise<GeneratedQuiz[]> {
  const url = docId ? `${API_BASE}/practice/quizzes?doc_id=${encodeURIComponent(docId)}` : `${API_BASE}/practice/quizzes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  return res.json();
}

/** Save a quiz attempt score and details */
export async function saveQuizResult(
  result: Omit<QuizResultRecord, 'id' | 'completed_at'>
): Promise<QuizResultRecord> {
  const res = await fetch(`${API_BASE}/practice/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });

  if (!res.ok) throw new Error('Failed to save quiz result');
  return res.json();
}

/** List past quiz results */
export async function listQuizResults(): Promise<QuizResultRecord[]> {
  const res = await fetch(`${API_BASE}/practice/results`);
  if (!res.ok) throw new Error('Failed to fetch quiz results');
  return res.json();
}

/** Generate flashcards using RAG and Gemini */
export async function generateFlashcards(options: {
  docId?: string;
  numCards?: number;
  difficulty?: string;
  topic?: string;
}): Promise<GeneratedFlashcardDeck> {
  const res = await fetch(`${API_BASE}/flashcards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doc_id: options.docId || null,
      num_cards: options.numCards || 6,
      difficulty: options.difficulty || 'medium',
      topic: options.topic || null,
    }),
  });

  if (!res.ok) {
    let msg = 'Failed to generate flashcards';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      msg = `Server error ${res.status}: ${res.statusText}`;
    }
    throw new Error(msg);
  }

  return res.json();
}

/** Get list of generated flashcard decks */
export async function listFlashcardDecks(docId?: string): Promise<GeneratedFlashcardDeck[]> {
  const url = docId ? `${API_BASE}/flashcards/decks?doc_id=${encodeURIComponent(docId)}` : `${API_BASE}/flashcards/decks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch flashcard decks');
  return res.json();
}

/** Save flashcard mastery progress (Known / Review Again) */
export async function saveFlashcardProgress(item: {
  card_id: string;
  deck_id: string;
  status: string;
  rating?: number | null;
}): Promise<FlashcardProgress> {
  const res = await fetch(`${API_BASE}/flashcards/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });

  if (!res.ok) throw new Error('Failed to update flashcard progress');
  return res.json();
}

/** Get flashcard progress state */
export async function getFlashcardProgress(deckId?: string): Promise<Record<string, FlashcardProgress>> {
  const url = deckId ? `${API_BASE}/flashcards/progress?deck_id=${encodeURIComponent(deckId)}` : `${API_BASE}/flashcards/progress`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch flashcard progress');
  return res.json();
}

// ── ML Learning Analytics Types & Methods ────────────────────────────────

export interface TopicAnalytics {
  topic: string;
  mastery: number;
  quiz_accuracy: number;
  quiz_attempts: number;
  cards_known: number;
  cards_review: number;
  cards_total: number;
  decay_days: number;
  classification: 'strong' | 'consolidating' | 'weak';
  weakness_probability: number;
  explanation: string;
  source_doc: string;
  page_number: number;
}

export interface WeakTopicItem {
  topic: string;
  mastery: number;
  weakness_probability: number;
  reason: string;
  source_doc: string;
  page_number: number;
  mistakes_count: number;
}

export interface RevisionTaskItem {
  id: string;
  title: string;
  topic: string;
  doc_name: string;
  page_number: number;
  priority: 'high' | 'medium' | 'low';
  type: 'flashcards' | 'quiz' | 'reading';
  estimated_minutes: number;
  reason: string;
  action_url: string;
}

export interface SpacedRepetitionCard {
  card_id: string;
  deck_id: string;
  deck_title: string;
  front: string;
  back: string;
  topic: string;
  filename: string;
  page_number: number;
  status: string;
  rating: number;
  interval_days: number;
  due_timestamp: number;
  is_overdue: boolean;
  priority_weight: number;
}

export interface MLDiagnostics {
  model_type: 'heuristic_baseline' | 'scikit_learn_logistic_regression';
  samples_count: number;
  min_samples_required: number;
  is_trained: boolean;
  status_note: string;
}

export interface LearningAnalyticsPayload {
  has_data: boolean;
  message?: string;
  overall_mastery: number;
  retention_rate: number;
  total_quizzes_completed: number;
  total_questions_answered: number;
  total_flashcards_reviewed: number;
  topics: TopicAnalytics[];
  strong_topics: string[];
  weak_topics: WeakTopicItem[];
  accuracy_trend: { date: string; score: number; doc_name: string }[];
  revision_tasks: RevisionTaskItem[];
  spaced_repetition: {
    due_today_count: number;
    due_this_week_count: number;
    total_cards: number;
    cards: SpacedRepetitionCard[];
  };
  ml_diagnostics: MLDiagnostics;
  updated_at: number;
}

/** Fetch full ML Learning Analytics */
export async function getLearningAnalytics(): Promise<LearningAnalyticsPayload> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to load learning analytics');
  return res.json();
}

/** Fetch personalized revision tasks and spaced-repetition cards */
export async function getRevisionSchedule(): Promise<{
  revision_tasks: RevisionTaskItem[];
  spaced_repetition: LearningAnalyticsPayload['spaced_repetition'];
  weak_topics: WeakTopicItem[];
  ml_diagnostics: MLDiagnostics;
}> {
  const res = await fetch(`${API_BASE}/analytics/revisions`);
  if (!res.ok) throw new Error('Failed to load revision schedule');
  return res.json();
}

/** Force recalculate learning analytics and ML weakness model */
export async function recalculateAnalytics(): Promise<LearningAnalyticsPayload> {
  const res = await fetch(`${API_BASE}/analytics/recalculate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to recalculate analytics');
  return res.json();
}

// ── Personalized Study Planner Types & Methods ───────────────────────────

export interface StudyGoal {
  id: string;
  title: string;
  subject_name: string;
  doc_id?: string | null;
  doc_name: string;
  exam_date: string;
  daily_study_minutes: number;
  target_mastery: number;
  created_at: number;
  updated_at: number;
}

export interface PlannerTask {
  id: string;
  goal_id: string;
  date: string;
  time: string;
  title: string;
  topic: string;
  type: 'revision' | 'quiz' | 'flashcards' | 'reading';
  priority: 'high' | 'medium' | 'low';
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  reason: string;
  doc_name: string;
  page_number: number;
  action_url: string;
  created_at: number;
  completed_at?: number | null;
}

export interface PlannerOverview {
  has_goals: boolean;
  has_documents: boolean;
  message?: string;
  goals: StudyGoal[];
  active_goal?: StudyGoal;
  today_stats: {
    total: number;
    completed: number;
    percentage: number;
    minutes_planned: number;
    minutes_spent: number;
    daily_budget?: number;
  };
  today_tasks: PlannerTask[];
  week_days: {
    date: string;
    day: string;
    day_number: number;
    is_today: boolean;
    tasks_count: number;
    completed_count: number;
  }[];
  weekly_tasks: PlannerTask[];
  upcoming_deadlines: {
    goal_id: string;
    title: string;
    subject_name: string;
    exam_date: string;
    days_remaining: number;
    is_urgent: boolean;
    target_mastery: number;
  }[];
}

/** Get full planner overview, daily checklist, and weekly calendar */
export async function getPlannerOverview(): Promise<PlannerOverview> {
  const res = await fetch(`${API_BASE}/planner/overview`);
  if (!res.ok) throw new Error('Failed to load planner overview');
  return res.json();
}

/** Get all study goals */
export async function listStudyGoals(): Promise<StudyGoal[]> {
  const res = await fetch(`${API_BASE}/planner/goals`);
  if (!res.ok) throw new Error('Failed to load study goals');
  return res.json();
}

/** Create or update a study goal */
export async function createStudyGoal(goal: {
  id?: string;
  title: string;
  subject_name?: string;
  doc_id?: string | null;
  doc_name?: string;
  exam_date: string;
  daily_study_minutes?: number;
  target_mastery?: number;
}): Promise<StudyGoal> {
  const res = await fetch(`${API_BASE}/planner/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error('Failed to create study goal');
  return res.json();
}

/** Delete a study goal */
export async function deleteStudyGoal(goalId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/planner/goals/${encodeURIComponent(goalId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete study goal');
  return res.json();
}

/** List planner tasks */
export async function listPlannerTasks(goalId?: string, date?: string): Promise<PlannerTask[]> {
  let url = `${API_BASE}/planner/tasks`;
  const params: string[] = [];
  if (goalId) params.push(`goal_id=${encodeURIComponent(goalId)}`);
  if (date) params.push(`date=${encodeURIComponent(date)}`);
  if (params.length) url += `?${params.join('&')}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load planner tasks');
  return res.json();
}

/** Update task status (complete, skip, reschedule) */
export async function updatePlannerTask(
  taskId: string,
  status: 'completed' | 'skipped' | 'rescheduled' | 'scheduled',
  newDate?: string
): Promise<PlannerTask> {
  const res = await fetch(`${API_BASE}/planner/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, new_date: newDate || null }),
  });
  if (!res.ok) throw new Error('Failed to update task status');
  return res.json();
}

/** Recalculate adaptive schedule based on updated progress */
export async function reschedulePlanner(): Promise<{ message: string; tasks_count: number }> {
  const res = await fetch(`${API_BASE}/planner/reschedule`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reschedule study plan');
  return res.json();
}

