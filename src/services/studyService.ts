import {
  MOCK_SUBJECTS,
  MOCK_DOCUMENTS,
  MOCK_STREAK,
  MOCK_WEAK_TOPICS,
  MOCK_UPCOMING_REVISIONS,
  MOCK_QUIZZES,
  MOCK_DECKS,
  MOCK_FLASHCARDS,
  MOCK_PLANNER_EVENTS,
  MOCK_ANALYTICS,
  MOCK_INITIAL_CHAT_MESSAGES
} from './mockData';
import type {
  Subject,
  DocumentItem,
  Quiz,
  QuizResult,
  FlashcardDeck,
  Flashcard,
  StudyStreak,
  WeakTopic,
  UpcomingRevision,
  PlannerEvent,
  AnalyticsData,
  ChatMessage
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class StudyService {
  private static documents: DocumentItem[] = [...MOCK_DOCUMENTS];
  private static plannerEvents: PlannerEvent[] = [...MOCK_PLANNER_EVENTS];
  private static flashcards: Record<string, Flashcard[]> = { ...MOCK_FLASHCARDS };
  private static chatHistory: Record<string, ChatMessage[]> = {
    'doc-1': [...MOCK_INITIAL_CHAT_MESSAGES]
  };

  // Subjects
  static async getSubjects(): Promise<Subject[]> {
    await delay(200);
    return [...MOCK_SUBJECTS];
  }

  // Dashboard Overview
  static async getDashboardOverview(): Promise<{
    subjects: Subject[];
    streak: StudyStreak;
    weakTopics: WeakTopic[];
    upcomingRevisions: UpcomingRevision[];
    analytics: AnalyticsData;
  }> {
    await delay(250);
    return {
      subjects: [...MOCK_SUBJECTS],
      streak: { ...MOCK_STREAK },
      weakTopics: [...MOCK_WEAK_TOPICS],
      upcomingRevisions: [...MOCK_UPCOMING_REVISIONS],
      analytics: { ...MOCK_ANALYTICS }
    };
  }

  // Documents / Library
  static async getDocuments(): Promise<DocumentItem[]> {
    await delay(200);
    return [...this.documents];
  }

  static async getDocumentById(id: string): Promise<DocumentItem | undefined> {
    await delay(150);
    return this.documents.find(d => d.id === id);
  }

  static async uploadDocument(file: { name: string; size: number; subjectId: string; tags: string[] }): Promise<DocumentItem> {
    await delay(1200);
    const subject = MOCK_SUBJECTS.find(s => s.id === file.subjectId) || MOCK_SUBJECTS[0];
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      subjectId: subject.id,
      subjectName: subject.name,
      fileType: 'pdf',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      pagesCount: Math.floor(Math.random() * 20) + 5,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'ready',
      tags: file.tags.length > 0 ? file.tags : ['Uploaded', subject.code],
      flashcardsGenerated: 12,
      questionsGenerated: 8,
      summary: `Automated AI breakdown for "${file.name}". Key concepts extracted and mapped to active recall decks.`,
      extractedKeyPoints: [
        'Core conceptual overview derived from document parsing.',
        'Key definitions and architectural formulas indexed.',
        'Cross-referenced with active practice test questions.'
      ],
      contentSample: [
        `Summary extract from ${file.name}: Core methodology and conceptual framework outlined in initial sections.`,
        `Section 2: Detailed discussion on performance implications, theoretical bounds, and implementation results.`
      ]
    };

    this.documents.unshift(newDoc);
    return newDoc;
  }

  // Chat / AI Study Room
  static async getChatMessages(documentId: string): Promise<ChatMessage[]> {
    await delay(150);
    return this.chatHistory[documentId] || [
      {
        id: `msg-welcome-${documentId}`,
        role: 'assistant',
        content: `I have analyzed this document. Feel free to ask about key takeaways, mathematical proofs, step-by-step breakdowns, or generate customized quizzes.`,
        timestamp: 'Just now',
        suggestedQuestions: [
          'What are the 3 main takeaways?',
          'Generate 5 practice flashcards from this text',
          'Explain the core mechanism step by step'
        ]
      }
    ];
  }

  static async sendChatMessage(documentId: string, userMessage: string): Promise<ChatMessage> {
    await delay(800);
    if (!this.chatHistory[documentId]) {
      this.chatHistory[documentId] = [];
    }

    const doc = this.documents.find(d => d.id === documentId) || this.documents[0];

    // Mock AI intelligent response generator based on query keywords
    let responseText = `Here is the structured breakdown based on **${doc.title}**:\n\n1. **Core Concept**: The material emphasizes efficient sequence representations and mathematical guarantees.\n2. **Critical Takeaway**: Reviewing Section 3 highlights the trade-offs between computational overhead and representation capacity.\n3. **Practical Application**: You can utilize these principles to solidify your intuition before the upcoming practice quiz.`;
    
    let citations = [
      {
        id: `cit-${Date.now()}`,
        documentId: doc.id,
        documentTitle: doc.title,
        pageNumber: Math.min(3, doc.pagesCount),
        excerpt: doc.extractedKeyPoints[0] || 'Detailed reference extract regarding key formulas and properties.',
        confidence: 0.97
      }
    ];

    if (userMessage.toLowerCase().includes('quiz') || userMessage.toLowerCase().includes('test')) {
      responseText = `I have generated a quick mini-drill for you based on this section:\n\n**Quick Check:** How does the architecture maintain stability during deep backpropagation?\n\n*Review the citation below or flip to Page 4 to verify your recall.*`;
    } else if (userMessage.toLowerCase().includes('formula') || userMessage.toLowerCase().includes('math')) {
      responseText = `The relevant mathematical formula from **${doc.title}** is:\n\n$$\\mathcal{L}(\\theta) = -\\mathbb{E}_{x \\sim \\mathcal{D}}\\left[ \\log P_\\theta(x) \\right] + \\lambda \\Omega(\\theta)$$\n\nWhere $\\lambda$ controls the regularization strength.`;
    }

    const aiMessage: ChatMessage = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: citations,
      keyTakeaways: [
        'Directly grounded in document citations',
        'Aligned with active recall objectives'
      ],
      suggestedQuestions: [
        'Can you give a concrete real-world example?',
        'How does this relate to previous topics?'
      ]
    };

    this.chatHistory[documentId].push({
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.chatHistory[documentId].push(aiMessage);
    return aiMessage;
  }

  // Quizzes / Practice
  static async getQuizzes(): Promise<Quiz[]> {
    await delay(200);
    return [...MOCK_QUIZZES];
  }

  static async getQuizById(id: string): Promise<Quiz | undefined> {
    await delay(150);
    return MOCK_QUIZZES.find(q => q.id === id) || MOCK_QUIZZES[0];
  }

  static async submitQuizResult(result: Omit<QuizResult, 'id' | 'date'>): Promise<QuizResult> {
    await delay(400);
    const newResult: QuizResult = {
      ...result,
      id: `res-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    return newResult;
  }

  // Flashcards
  static async getFlashcardDecks(): Promise<FlashcardDeck[]> {
    await delay(200);
    return [...MOCK_DECKS];
  }

  static async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    await delay(200);
    return this.flashcards[deckId] || MOCK_FLASHCARDS['deck-1'];
  }

  static async updateCardLeitner(cardId: string, rating: 'again' | 'hard' | 'good' | 'easy'): Promise<void> {
    await delay(100);
    // Leitner system simulation
  }

  // Analytics
  static async getAnalytics(): Promise<AnalyticsData> {
    await delay(300);
    return { ...MOCK_ANALYTICS };
  }

  // Study Planner
  static async getPlannerEvents(): Promise<PlannerEvent[]> {
    await delay(200);
    return [...this.plannerEvents];
  }

  static async addPlannerEvent(event: Omit<PlannerEvent, 'id'>): Promise<PlannerEvent> {
    await delay(300);
    const newEvent: PlannerEvent = {
      ...event,
      id: `plan-${Date.now()}`
    };
    this.plannerEvents.push(newEvent);
    return newEvent;
  }

  static async toggleEventStatus(id: string): Promise<PlannerEvent | undefined> {
    await delay(150);
    const event = this.plannerEvents.find(e => e.id === id);
    if (event) {
      event.status = event.status === 'completed' ? 'scheduled' : 'completed';
    }
    return event;
  }
}
