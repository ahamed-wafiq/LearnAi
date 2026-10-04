export type SubjectType = 
  | 'Computer Science'
  | 'Neuroscience'
  | 'Macroeconomics'
  | 'Quantum Physics'
  | 'Machine Learning';

export interface Subject {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  progress: number;
  totalDocuments: number;
  totalQuizzes: number;
  flashcardsCount: number;
  masteryLevel: 'Novice' | 'Intermediate' | 'Proficient' | 'Master';
  description: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  fileType: 'pdf' | 'epub' | 'docx';
  fileSize: string;
  pagesCount: number;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  tags: string[];
  flashcardsGenerated: number;
  questionsGenerated: number;
  summary: string;
  extractedKeyPoints: string[];
  contentSample?: string[];
}

export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Citation[];
  keyTakeaways?: string[];
  suggestedQuestions?: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  citation?: Citation;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface QuizResult {
  id: string;
  quizId: string;
  title: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpentSeconds: number;
  date: string;
  topicBreakdown: { topic: string; score: number; total: number }[];
  userAnswers: Record<number, number>;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  repetitionLevel: number; // Leitner box 1 to 5
  nextReviewDate: string;
  lastReviewed?: string;
  formula?: string;
  codeSnippet?: string;
  tags: string[];
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  cardCount: number;
  masteryPercent: number;
  dueTodayCount: number;
  color: string;
  description: string;
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  totalMinutesStudied: number;
  weeklyActivity: {
    day: string;
    date: string;
    studiedMinutes: number;
    completedGoals: boolean;
  }[];
}

export interface WeakTopic {
  id: string;
  topic: string;
  subjectName: string;
  accuracy: number;
  suggestedAction: string;
  documentId?: string;
}

export interface UpcomingRevision {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
  type: 'flashcards' | 'quiz' | 'document_review';
  priority: 'high' | 'medium' | 'low';
  durationMinutes: number;
}

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  type: 'revision' | 'quiz' | 'reading' | 'assignment';
  subjectName: string;
  status: 'scheduled' | 'completed' | 'in_progress';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface AnalyticsData {
  overallMastery: number;
  retentionRate: number;
  totalStudyHours: number;
  quizzesCompleted: number;
  weeklyStudyHours: { week: string; hours: number; target: number }[];
  subjectMastery: { subject: string; mastery: number; accuracy: number; studyTimeHours: number; color: string }[];
  quizHistory: { date: string; score: number; subject: string }[];
  masteryHeatmap: { skill: string; category: string; level: number; decayDays: number }[];
}
