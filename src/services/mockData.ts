import type {
  Subject,
  DocumentItem,
  Quiz,
  FlashcardDeck,
  Flashcard,
  StudyStreak,
  WeakTopic,
  UpcomingRevision,
  PlannerEvent,
  AnalyticsData,
  ChatMessage
} from '../types';

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    name: 'Machine Learning & AI',
    code: 'CS-482',
    iconName: 'BrainCircuit',
    color: '#8B5CF6',
    progress: 78,
    totalDocuments: 8,
    totalQuizzes: 14,
    flashcardsCount: 64,
    masteryLevel: 'Proficient',
    description: 'Deep neural networks, attention mechanisms, reinforcement learning, and transformers.',
  },
  {
    id: 'sub-2',
    name: 'Distributed Systems',
    code: 'CS-544',
    iconName: 'ServerCrash',
    color: '#3B82F6',
    progress: 62,
    totalDocuments: 6,
    totalQuizzes: 9,
    flashcardsCount: 48,
    masteryLevel: 'Intermediate',
    description: 'Consensus algorithms (Raft, Paxos), CAP theorem, replication, and vector clocks.',
  },
  {
    id: 'sub-3',
    name: 'Cognitive Neuroscience',
    code: 'NEUR-301',
    iconName: 'Activity',
    color: '#06B6D4',
    progress: 85,
    totalDocuments: 5,
    totalQuizzes: 12,
    flashcardsCount: 52,
    masteryLevel: 'Proficient',
    description: 'Synaptic plasticity, hippocampal memory consolidation, and prefrontal cortex dynamics.',
  },
  {
    id: 'sub-4',
    name: 'Advanced Macroeconomics',
    code: 'ECON-410',
    iconName: 'TrendingUp',
    color: '#10B981',
    progress: 44,
    totalDocuments: 4,
    totalQuizzes: 6,
    flashcardsCount: 36,
    masteryLevel: 'Novice',
    description: 'Dynamic stochastic general equilibrium (DSGE), central bank rates, and fiscal multipliers.',
  },
  {
    id: 'sub-5',
    name: 'Quantum Computation',
    code: 'PHYS-620',
    iconName: 'Atom',
    color: '#EC4899',
    progress: 92,
    totalDocuments: 7,
    totalQuizzes: 16,
    flashcardsCount: 75,
    masteryLevel: 'Master',
    description: 'Qubits, quantum phase estimation, Shor algorithm, and decoherence mitigation.',
  }
];

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Attention Is All You Need — Vaswani et al. (2017)',
    subjectId: 'sub-1',
    subjectName: 'Machine Learning & AI',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    pagesCount: 15,
    uploadDate: '2026-09-28',
    status: 'ready',
    tags: ['Transformers', 'Self-Attention', 'NLP', 'Multi-Head'],
    flashcardsGenerated: 24,
    questionsGenerated: 18,
    summary: 'Foundational paper introducing the Transformer architecture based solely on self-attention mechanisms, eliminating recurrence and convolutions in sequence-to-sequence modeling.',
    extractedKeyPoints: [
      'Scaled Dot-Product Attention: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) * V',
      'Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions.',
      'Positional encodings using sinusoidal functions inject relative token positioning information.',
      'Residual connections followed by layer normalization (Pre-LN vs Post-LN) stabilize gradient flow.'
    ],
    contentSample: [
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.",
      "We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.",
      "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values.",
      "In this work we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention."
    ]
  },
  {
    id: 'doc-2',
    title: 'In Search of an Understandable Consensus Algorithm (Raft)',
    subjectId: 'sub-2',
    subjectName: 'Distributed Systems',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    pagesCount: 18,
    uploadDate: '2026-09-25',
    status: 'ready',
    tags: ['Consensus', 'Raft', 'State Machine', 'Leader Election'],
    flashcardsGenerated: 20,
    questionsGenerated: 15,
    summary: 'Detailed specification of the Raft consensus algorithm, designed to be more understandable than Paxos while providing equivalent fault tolerance and state machine safety.',
    extractedKeyPoints: [
      'Leader Election: Randomized election timeouts prevent split votes and elect a unique leader per term.',
      'Log Replication: The leader accepts client commands, appends them to its log, and propagates entries to followers.',
      'Safety: A leader must contain all committed entries from past terms (Leader Completeness Property).',
      'Cluster Membership Changes: Joint consensus approach ensures overlap between old and new configurations.'
    ],
    contentSample: [
      "Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos; this makes Raft more understandable than Paxos.",
      "To enhance understandability, Raft separates the key elements of consensus, such as leader election, log replication, and safety, and it enforces a stronger degree of coherency to reduce the number of states that must be considered.",
      "Raft uses randomized election timeouts to ensure that split votes are resolved quickly. This approach is simple and avoids complex conflict resolution mechanisms."
    ]
  },
  {
    id: 'doc-3',
    title: 'Cellular & Molecular Mechanisms of Synaptic Plasticity',
    subjectId: 'sub-3',
    subjectName: 'Cognitive Neuroscience',
    fileType: 'pdf',
    fileSize: '3.1 MB',
    pagesCount: 22,
    uploadDate: '2026-09-20',
    status: 'ready',
    tags: ['LTP', 'NMDA Receptors', 'Memory', 'Neurobiology'],
    flashcardsGenerated: 30,
    questionsGenerated: 22,
    summary: 'Comprehensive analysis of Long-Term Potentiation (LTP) and Long-Term Depression (LTD), highlighting NMDA receptor activation, Ca2+ influx, and AMPA receptor trafficking.',
    extractedKeyPoints: [
      'NMDA receptors act as coincidence detectors requiring both glutamate binding and membrane depolarization (Mg2+ unblock).',
      'Calcium influx triggers CaMKII activation, leading to AMPA receptor phosphorylation and insertion into postsynaptic density.',
      'Late-LTP requires de novo gene transcription mediated by CREB phosphorylation.',
      'Structural plasticity involves dendritic spine enlargement and actin filament reorganization.'
    ]
  },
  {
    id: 'doc-4',
    title: 'Monetary Policy Regimes & Taylor Rule Formulations',
    subjectId: 'sub-4',
    subjectName: 'Advanced Macroeconomics',
    fileType: 'pdf',
    fileSize: '1.2 MB',
    pagesCount: 12,
    uploadDate: '2026-09-15',
    status: 'ready',
    tags: ['Taylor Rule', 'Central Banking', 'Inflation Targeting', 'Output Gap'],
    flashcardsGenerated: 16,
    questionsGenerated: 10,
    summary: 'Mathematical formulation and historical calibration of the Taylor Rule for nominal interest rate determination based on inflation gaps and GDP output gaps.',
    extractedKeyPoints: [
      'Original Taylor Rule: i_t = r* + pi_t + 0.5(pi_t - pi*) + 0.5(y_t - y*)',
      'The Taylor Principle requires nominal rate hikes greater than one-for-one with inflation increases to raise real rates.',
      'Zero Lower Bound (ZLB) constraints necessitate unconventional monetary policies like Quantitative Easing (QE).',
      'Forward guidance alters long-term expectations by signaling future short-term rate paths.'
    ]
  },
  {
    id: 'doc-5',
    title: 'Quantum Circuits and Fault-Tolerant Thresholds',
    subjectId: 'sub-5',
    subjectName: 'Quantum Computation',
    fileType: 'pdf',
    fileSize: '4.5 MB',
    pagesCount: 34,
    uploadDate: '2026-09-10',
    status: 'ready',
    tags: ['Surface Codes', 'Error Correction', 'Clifford Gates', 'Thresholds'],
    flashcardsGenerated: 35,
    questionsGenerated: 25,
    summary: 'Investigation of surface codes, syndrome extraction circuits, topological error correction, and physical error threshold limits for scalable quantum hardware.',
    extractedKeyPoints: [
      'Surface code threshold approaches ~1% physical error rate under standard depolarizing noise models.',
      'Syndrome extraction measures stabilizer operators (X-type and Z-type) without collapsing the encoded quantum state.',
      'Magic state distillation provides non-Clifford T-gates to achieve universal fault-tolerant computation.',
      'Minimum-Weight Perfect Matching (MWPM) decoders map measurement error syndromes to recovery operations.'
    ]
  },
  {
    id: 'doc-6',
    title: 'Reinforcement Learning with Human Feedback (RLHF) Dynamics',
    subjectId: 'sub-1',
    subjectName: 'Machine Learning & AI',
    fileType: 'pdf',
    fileSize: '2.8 MB',
    pagesCount: 19,
    uploadDate: '2026-10-01',
    status: 'processing',
    tags: ['RLHF', 'PPO', 'DPO', 'Reward Model'],
    flashcardsGenerated: 0,
    questionsGenerated: 0,
    summary: 'Extraction and document parsing in progress. Analyzing policy optimization with KL penalty terms and Direct Preference Optimization (DPO) alternatives.',
    extractedKeyPoints: []
  }
];

export const MOCK_STREAK: StudyStreak = {
  currentStreak: 14,
  longestStreak: 28,
  totalMinutesStudied: 1420,
  weeklyActivity: [
    { day: 'Mon', date: 'Sep 28', studiedMinutes: 65, completedGoals: true },
    { day: 'Tue', date: 'Sep 29', studiedMinutes: 90, completedGoals: true },
    { day: 'Wed', date: 'Sep 30', studiedMinutes: 45, completedGoals: true },
    { day: 'Thu', date: 'Oct 01', studiedMinutes: 110, completedGoals: true },
    { day: 'Fri', date: 'Oct 02', studiedMinutes: 75, completedGoals: true },
    { day: 'Sat', date: 'Oct 03', studiedMinutes: 120, completedGoals: true },
    { day: 'Sun', date: 'Oct 04', studiedMinutes: 30, completedGoals: false }
  ]
};

export const MOCK_WEAK_TOPICS: WeakTopic[] = [
  {
    id: 'wt-1',
    topic: 'Taylor Rule Output Gap Calculations',
    subjectName: 'Advanced Macroeconomics',
    accuracy: 38,
    suggestedAction: 'Review Taylor Principle formula and run a 5-question targeted drill.',
    documentId: 'doc-4'
  },
  {
    id: 'wt-2',
    topic: 'Joint Consensus Transition in Raft',
    subjectName: 'Distributed Systems',
    accuracy: 45,
    suggestedAction: 'Re-examine Section 6 of Raft paper on configuration changes.',
    documentId: 'doc-2'
  },
  {
    id: 'wt-3',
    topic: 'Sinusoidal Positional Encoding Math',
    subjectName: 'Machine Learning & AI',
    accuracy: 52,
    suggestedAction: 'Practice calculating PE(pos, 2i) embedding coordinates.',
    documentId: 'doc-1'
  }
];

export const MOCK_UPCOMING_REVISIONS: UpcomingRevision[] = [
  {
    id: 'rev-1',
    title: 'Transformer Architecture & Self-Attention',
    subjectName: 'Machine Learning & AI',
    dueDate: 'Today at 4:00 PM',
    type: 'flashcards',
    priority: 'high',
    durationMinutes: 15
  },
  {
    id: 'rev-2',
    title: 'Raft Leader Election & Log Invariant Quiz',
    subjectName: 'Distributed Systems',
    dueDate: 'Tomorrow at 10:00 AM',
    type: 'quiz',
    priority: 'high',
    durationMinutes: 20
  },
  {
    id: 'rev-3',
    title: 'NMDA Receptor & CaMKII Pathway Review',
    subjectName: 'Cognitive Neuroscience',
    dueDate: 'Oct 06, 2:30 PM',
    type: 'document_review',
    priority: 'medium',
    durationMinutes: 25
  },
  {
    id: 'rev-4',
    title: 'Surface Code Stabilizers & Decoders',
    subjectName: 'Quantum Computation',
    dueDate: 'Oct 07, 11:00 AM',
    type: 'flashcards',
    priority: 'low',
    durationMinutes: 15
  }
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Transformer Mechanics & Multi-Head Attention',
    subjectId: 'sub-1',
    subjectName: 'Machine Learning & AI',
    timeLimitMinutes: 12,
    difficulty: 'Intermediate',
    questions: [
      {
        id: 'q1-1',
        question: 'Why is the dot-product in Scaled Dot-Product Attention divided by sqrt(d_k)?',
        options: [
          'To reduce computational complexity from O(N^2) to O(N)',
          'To prevent dot products from growing large in magnitude, pushing softmax into regions with vanishing gradients',
          'To enforce orthogonality between Query and Key vectors',
          'To ensure the attention weights sum up to exactly zero'
        ],
        correctIndex: 1,
        explanation: 'For large values of d_k, dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients (gradient saturation). Scaling by 1/sqrt(d_k) counteracts this effect.',
        topic: 'Attention Scaling',
        difficulty: 'Medium',
        citation: {
          id: 'cit-1',
          documentId: 'doc-1',
          documentTitle: 'Attention Is All You Need (Vaswani et al.)',
          pageNumber: 4,
          excerpt: 'We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by 1/sqrt(d_k).',
          confidence: 0.98
        }
      },
      {
        id: 'q1-2',
        question: 'What allows Multi-Head Attention to attend to information from different representation subspaces?',
        options: [
          'Linearly projecting the queries, keys, and values h times with different learned linear projections',
          'Applying multiple sequential convolution filters with increasing kernel sizes',
          'Using recurrent hidden state updates across sequence steps',
          'Averaging the input embeddings before the projection layer'
        ],
        correctIndex: 0,
        explanation: 'Multi-head attention projects Q, K, and V h times with distinct learned linear projections into d_k, d_k, and d_v dimensions, enabling the model to jointly attend to various representational subspaces simultaneously.',
        topic: 'Multi-Head Projections',
        difficulty: 'Medium',
        citation: {
          id: 'cit-2',
          documentId: 'doc-1',
          documentTitle: 'Attention Is All You Need (Vaswani et al.)',
          pageNumber: 5,
          excerpt: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With single attention head, averaging inhibits this.',
          confidence: 0.96
        }
      },
      {
        id: 'q1-3',
        question: 'Which positional encoding formulation was chosen in the original Transformer paper?',
        options: [
          'Fixed learned embeddings optimized via stochastic gradient descent',
          'Sinusoidal functions of different frequencies: PE(pos, 2i) = sin(pos/10000^(2i/d_model))',
          'Binary integer indices normalized between 0 and 1',
          'Rotary Position Embeddings (RoPE) based on complex numbers'
        ],
        correctIndex: 1,
        explanation: 'The original paper used fixed sinusoidal functions. For any fixed offset k, PE(pos+k) can be represented as a linear function of PE(pos), making it easy to learn relative position relationships.',
        topic: 'Positional Encoding',
        difficulty: 'Hard',
        citation: {
          id: 'cit-3',
          documentId: 'doc-1',
          documentTitle: 'Attention Is All You Need (Vaswani et al.)',
          pageNumber: 6,
          excerpt: 'We use sine and cosine functions of different frequencies: PE(pos, 2i) = sin(pos/10000^(2i/d_model)) and PE(pos, 2i+1) = cos(pos/10000^(2i/d_model)).',
          confidence: 0.99
        }
      },
      {
        id: 'q1-4',
        question: 'In the Transformer Decoder, why is the self-attention sub-layer masked?',
        options: [
          'To prevent the decoder from calculating padding token gradients',
          'To prevent positions from attending to subsequent (future) positions during auto-regressive generation',
          'To drop 50% of the attention weights for regularization',
          'To make the matrix multiplication symmetric'
        ],
        correctIndex: 1,
        explanation: 'Masking ensures that the predictions for position i can depend only on known outputs at positions strictly before i (causal masking).',
        topic: 'Causal Masking',
        difficulty: 'Easy',
        citation: {
          id: 'cit-4',
          documentId: 'doc-1',
          documentTitle: 'Attention Is All You Need (Vaswani et al.)',
          pageNumber: 3,
          excerpt: 'This masking, combined with fact that output embeddings are offset by one position, ensures that predictions for position i can depend only on known outputs at positions less than i.',
          confidence: 0.97
        }
      },
      {
        id: 'q1-5',
        question: 'What is the computational complexity per layer of Self-Attention with sequence length n and representation dimension d?',
        options: [
          'O(n * d^2)',
          'O(n^2 * d)',
          'O(n^3)',
          'O(d * log(n))'
        ],
        correctIndex: 1,
        explanation: 'Self-attention calculates pairwise dot products between all n tokens, producing an n x n attention matrix for dimension d, resulting in O(n^2 * d) complexity.',
        topic: 'Complexity Analysis',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Raft Consensus: Leader Election & Log Safety',
    subjectId: 'sub-2',
    subjectName: 'Distributed Systems',
    timeLimitMinutes: 15,
    difficulty: 'Advanced',
    questions: [
      {
        id: 'q2-1',
        question: 'How does Raft prevent split votes during leader election from indefinitely stalling the system?',
        options: [
          'By assigning deterministic priorities based on server node IDs',
          'By using randomized election timeouts chosen uniformly from a range (e.g., 150-300ms)',
          'By allowing multiple leaders to serve writes concurrently',
          'By querying a central external coordinator node'
        ],
        correctIndex: 1,
        explanation: 'Randomized election timeouts spread out split votes so that one node will typically timeout first, claim votes, and become leader before others finish their timeout period.',
        topic: 'Election Safety',
        difficulty: 'Medium',
        citation: {
          id: 'cit-5',
          documentId: 'doc-2',
          documentTitle: 'In Search of an Understandable Consensus Algorithm',
          pageNumber: 6,
          excerpt: 'Raft uses randomized election timeouts to ensure that split votes are resolved quickly. Election timeouts are chosen randomly from a fixed interval (e.g., 150–300ms).',
          confidence: 0.99
        }
      },
      {
        id: 'q2-2',
        question: 'Under what condition does a Raft candidate receive a vote from a voter node?',
        options: [
          'The candidate node has a smaller server ID number',
          'The candidate log is at least as up-to-date as the voter own log, and the candidate term >= voter current term',
          'The voter node has not rebooted in the last 60 seconds',
          'The candidate has lower network latency than the previous leader'
        ],
        correctIndex: 1,
        explanation: 'Raft election safety requires that candidates must possess all committed log entries. A voter denies its vote if its own log is more up-to-date than the candidate log.',
        topic: 'Vote Criterion',
        difficulty: 'Hard'
      }
    ]
  }
];

export const MOCK_DECKS: FlashcardDeck[] = [
  {
    id: 'deck-1',
    title: 'Transformer & Attention Architecture',
    subjectId: 'sub-1',
    subjectName: 'Machine Learning & AI',
    cardCount: 24,
    masteryPercent: 82,
    dueTodayCount: 8,
    color: '#8B5CF6',
    description: 'Self-attention, Multi-Head projections, Positional Encodings, Pre-LN vs Post-LN normalization.'
  },
  {
    id: 'deck-2',
    title: 'Raft & Paxos Consensus Fundamentals',
    subjectId: 'sub-2',
    subjectName: 'Distributed Systems',
    cardCount: 20,
    masteryPercent: 65,
    dueTodayCount: 12,
    color: '#3B82F6',
    description: 'Term numbers, leader completeness, log invariants, joint consensus, and heartbeat timers.'
  },
  {
    id: 'deck-3',
    title: 'Synaptic Plasticity & Neurotransmission',
    subjectId: 'sub-3',
    subjectName: 'Cognitive Neuroscience',
    cardCount: 30,
    masteryPercent: 90,
    dueTodayCount: 4,
    color: '#06B6D4',
    description: 'LTP, LTD, NMDA/AMPA dynamics, retrograde signaling (NO), and dendritic spines.'
  },
  {
    id: 'deck-4',
    title: 'Taylor Rules & Central Banking Policy',
    subjectId: 'sub-4',
    subjectName: 'Advanced Macroeconomics',
    cardCount: 16,
    masteryPercent: 40,
    dueTodayCount: 14,
    color: '#10B981',
    description: 'Inflation targeting, natural rate of interest r*, output gap estimations, and monetary rules.'
  }
];

export const MOCK_FLASHCARDS: Record<string, Flashcard[]> = {
  'deck-1': [
    {
      id: 'fc-1',
      deckId: 'deck-1',
      question: 'What is the exact formula for Scaled Dot-Product Attention?',
      answer: 'Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V\n\nWhere Q is Queries, K is Keys, V is Values, and d_k is the dimension of the keys.',
      subjectName: 'Machine Learning & AI',
      difficulty: 'medium',
      repetitionLevel: 4,
      nextReviewDate: '2026-10-05',
      formula: 'Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
      tags: ['Math', 'Attention', 'Formula']
    },
    {
      id: 'fc-2',
      deckId: 'deck-1',
      question: 'Why do we need Positional Encodings in Transformer models unlike RNNs?',
      answer: 'Because self-attention contains no recurrence and no convolution, it is completely permutation-equivariant. Without positional encodings, the model cannot distinguish the order of tokens in the sequence.',
      subjectName: 'Machine Learning & AI',
      difficulty: 'easy',
      repetitionLevel: 5,
      nextReviewDate: '2026-10-09',
      tags: ['Architecture', 'Concept']
    },
    {
      id: 'fc-3',
      deckId: 'deck-1',
      question: 'What is the difference between Pre-LN and Post-LN in deep Transformer blocks?',
      answer: 'Post-LN places layer normalization after the residual addition (x = LayerNorm(x + SubLayer(x))), which can lead to vanishing/exploding gradients in very deep models.\n\nPre-LN applies normalization prior to the sublayer (x = x + SubLayer(LayerNorm(x))), providing an unobstructed identity gradient path.',
      subjectName: 'Machine Learning & AI',
      difficulty: 'hard',
      repetitionLevel: 2,
      nextReviewDate: '2026-10-04',
      tags: ['Normalization', 'Gradients']
    },
    {
      id: 'fc-4',
      deckId: 'deck-1',
      question: 'How is the dimension of each head (d_k) chosen in Multi-Head Attention?',
      answer: 'If the total embedding dimension is d_model and there are h heads, typically d_k = d_v = d_model / h. For example, in base Transformer: d_model = 512, h = 8 -> d_k = 64.',
      subjectName: 'Machine Learning & AI',
      difficulty: 'easy',
      repetitionLevel: 3,
      nextReviewDate: '2026-10-06',
      tags: ['Hyperparameters']
    },
    {
      id: 'fc-5',
      deckId: 'deck-1',
      question: 'What is the role of the Feed-Forward Network (FFN) sub-layer in each transformer block?',
      answer: 'FFN(x) = max(0, xW1 + b1)W2 + b2\n\nIt consists of two linear transformations with a ReLU/GELU activation in between. It processes each token position separately and identically, expanding capacity (typically 4x d_model).',
      subjectName: 'Machine Learning & AI',
      difficulty: 'medium',
      repetitionLevel: 4,
      nextReviewDate: '2026-10-07',
      formula: '\\text{FFN}(x) = \\max(0, xW_1 + b_1)W_2 + b_2',
      tags: ['FeedForward', 'Architecture']
    }
  ],
  'deck-2': [
    {
      id: 'fc-201',
      deckId: 'deck-2',
      question: 'What is the Leader Completeness property in Raft?',
      answer: 'If a log entry is committed in a given term, then that entry will be present in the logs of the leaders for all higher-numbered terms.',
      subjectName: 'Distributed Systems',
      difficulty: 'hard',
      repetitionLevel: 2,
      nextReviewDate: '2026-10-04',
      tags: ['Safety', 'Raft']
    },
    {
      id: 'fc-202',
      deckId: 'deck-2',
      question: 'What triggers a Raft follower to become a candidate and initiate an election?',
      answer: 'If a follower receives no heartbeat communication (AppendEntries RPC) from the leader over a period called the election timeout.',
      subjectName: 'Distributed Systems',
      difficulty: 'easy',
      repetitionLevel: 4,
      nextReviewDate: '2026-10-07',
      tags: ['LeaderElection']
    }
  ]
};

export const MOCK_INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I am your AI Study Copilot for **Attention Is All You Need (Vaswani et al.)**. I have indexed all 15 pages, mathematical formulations, and diagrams. Ask me anything about self-attention, query-key scaling, positional encodings, or test your comprehension.",
    timestamp: '10:00 AM',
    suggestedQuestions: [
      'Explain the mathematical intuition behind sqrt(d_k) scaling',
      'How does Multi-Head Attention differ from single-head?',
      'Why are sinusoidal positional encodings effective?'
    ]
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Why does the Transformer paper scale the dot product by the square root of the key dimension (d_k)?',
    timestamp: '10:02 AM'
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: `Great question! The scaling factor $\\frac{1}{\\sqrt{d_k}}$ is crucial for training stability in large model dimensions.

### Core Mathematical Reason:
Assume that components of Query $q$ and Key $k$ are independent random variables with zero mean and unit variance ($E[q_i]=0, \\text{Var}(q_i)=1$).

Their dot product:
$$q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i$$
has a mean of $0$ and a **variance of $d_k$**.

As $d_k$ grows large (e.g., $d_k = 64$ or $128$):
1. The magnitude of the raw dot products grows proportionally to $\\sqrt{d_k}$.
2. When fed into the $\\text{softmax}$ function, very large positive values cause the softmax distribution to become extremely peaky (approaching a one-hot vector).
3. The gradient of $\\text{softmax}$ in these saturated regions becomes **vanishingly small**, crippling backpropagation.

Dividing by $\\sqrt{d_k}$ normalizes the variance back to $1.0$, preserving steady gradient flow.`,
    timestamp: '10:02 AM',
    citations: [
      {
        id: 'cit-vaswani-4',
        documentId: 'doc-1',
        documentTitle: 'Attention Is All You Need',
        pageNumber: 4,
        excerpt: 'We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by 1/sqrt(d_k).',
        confidence: 0.99
      }
    ],
    keyTakeaways: [
      'Without scaling, variance grows to d_k',
      'High values saturate softmax and vanish gradients',
      'Dividing by sqrt(d_k) restores variance to 1.0'
    ],
    suggestedQuestions: [
      'What happens if we replace Softmax with a linear activation?',
      'How does this interact with causal masking in decoders?',
      'Generate a 3-question mini-quiz on this topic'
    ]
  }
];

export const MOCK_PLANNER_EVENTS: PlannerEvent[] = [
  {
    id: 'plan-1',
    title: 'Transformer Architecture & Self-Attention Drill',
    date: '2026-10-03',
    time: '14:00',
    durationMinutes: 45,
    type: 'revision',
    subjectName: 'Machine Learning & AI',
    status: 'in_progress',
    priority: 'high',
    notes: 'Focus on multi-head math and causal mask implementations.'
  },
  {
    id: 'plan-2',
    title: 'Raft Leader Election & Safety Proofs',
    date: '2026-10-03',
    time: '17:30',
    durationMinutes: 30,
    type: 'reading',
    subjectName: 'Distributed Systems',
    status: 'scheduled',
    priority: 'medium',
    notes: 'Read Section 5.2 and 5.4 in Raft paper.'
  },
  {
    id: 'plan-3',
    title: 'Taylor Rule Problem Set & Drill',
    date: '2026-10-04',
    time: '10:00',
    durationMinutes: 60,
    type: 'quiz',
    subjectName: 'Advanced Macroeconomics',
    status: 'scheduled',
    priority: 'high',
    notes: 'Calculate nominal rate responses to 2% inflation shocks.'
  },
  {
    id: 'plan-4',
    title: 'NMDA Receptor & CaMKII Pathway Review',
    date: '2026-10-05',
    time: '15:00',
    durationMinutes: 40,
    type: 'revision',
    subjectName: 'Cognitive Neuroscience',
    status: 'scheduled',
    priority: 'medium',
    notes: 'Review LTP flashcards in Leitner box 2 and 3.'
  },
  {
    id: 'plan-5',
    title: 'Quantum Surface Codes & MWPM Decoders',
    date: '2026-10-06',
    time: '11:00',
    durationMinutes: 50,
    type: 'assignment',
    subjectName: 'Quantum Computation',
    status: 'scheduled',
    priority: 'low',
    notes: 'Diagram X and Z stabilizer measurement cycles.'
  }
];

export const MOCK_ANALYTICS: AnalyticsData = {
  overallMastery: 76,
  retentionRate: 89,
  totalStudyHours: 42.5,
  quizzesCompleted: 38,
  weeklyStudyHours: [
    { week: 'Wk 35', hours: 6.2, target: 8.0 },
    { week: 'Wk 36', hours: 7.8, target: 8.0 },
    { week: 'Wk 37', hours: 9.1, target: 8.0 },
    { week: 'Wk 38', hours: 8.4, target: 8.0 },
    { week: 'Wk 39', hours: 10.5, target: 8.0 },
    { week: 'Wk 40', hours: 8.9, target: 8.0 }
  ],
  subjectMastery: [
    { subject: 'Quantum Comp.', mastery: 92, accuracy: 94, studyTimeHours: 12.4, color: '#EC4899' },
    { subject: 'Neuroscience', mastery: 85, accuracy: 88, studyTimeHours: 9.8, color: '#06B6D4' },
    { subject: 'Machine Learning', mastery: 78, accuracy: 82, studyTimeHours: 11.2, color: '#8B5CF6' },
    { subject: 'Dist. Systems', mastery: 62, accuracy: 71, studyTimeHours: 6.5, color: '#3B82F6' },
    { subject: 'Macroeconomics', mastery: 44, accuracy: 56, studyTimeHours: 2.6, color: '#10B981' }
  ],
  quizHistory: [
    { date: 'Sep 24', score: 72, subject: 'Machine Learning' },
    { date: 'Sep 26', score: 85, subject: 'Neuroscience' },
    { date: 'Sep 28', score: 68, subject: 'Dist. Systems' },
    { date: 'Sep 30', score: 94, subject: 'Quantum Comp.' },
    { date: 'Oct 01', score: 58, subject: 'Macroeconomics' },
    { date: 'Oct 02', score: 88, subject: 'Machine Learning' },
    { date: 'Oct 03', score: 92, subject: 'Machine Learning' }
  ],
  masteryHeatmap: [
    { skill: 'Self-Attention Math', category: 'ML & AI', level: 90, decayDays: 1 },
    { skill: 'Positional Encodings', category: 'ML & AI', level: 65, decayDays: 4 },
    { skill: 'Pre-LN vs Post-LN', category: 'ML & AI', level: 75, decayDays: 2 },
    { skill: 'Raft Leader Election', category: 'Systems', level: 80, decayDays: 1 },
    { skill: 'Raft Log Matching', category: 'Systems', level: 55, decayDays: 6 },
    { skill: 'Joint Consensus', category: 'Systems', level: 45, decayDays: 8 },
    { skill: 'NMDA Coincidence', category: 'Neuro', level: 95, decayDays: 1 },
    { skill: 'CaMKII Phosphorylation', category: 'Neuro', level: 82, decayDays: 3 },
    { skill: 'Taylor Rule Formula', category: 'Econ', level: 38, decayDays: 10 },
    { skill: 'Taylor Principle Rate', category: 'Econ', level: 42, decayDays: 7 },
    { skill: 'Surface Code Stabilizers', category: 'Quantum', level: 94, decayDays: 1 },
    { skill: 'Magic State Distillation', category: 'Quantum', level: 88, decayDays: 2 }
  ]
};
