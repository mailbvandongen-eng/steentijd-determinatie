// Beslisboom types
export interface Question {
  vraag: string;
  ja: string | null;
  nee: string | null;
}

export interface DecisionTree {
  [questionId: string]: Question;
}

// Sessie types
export interface DeterminationStep {
  questionId: string;
  questionText: string;
  answer: 'ja' | 'nee' | 'twijfel';
  referenceImages: string[];
  timestamp: string;
}

// Afbeelding met label voor verschillende zijden
export interface LabeledImage {
  label: 'dorsaal' | 'ventraal' | 'zijkant' | 'extra' | 'frame1' | 'frame2' | 'frame3' | 'frame4' | 'frame5' | 'frame6' | 'frame7' | 'frame8';
  blob: Blob;
  thumbnail: string;
  // Optionele archeologische tekening (schematische weergave)
  drawing?: string; // base64 data URL van de tekening
}

// Locatie voor vondsten
export interface VondstLocatie {
  lat: number;
  lng: number;
  naam?: string; // Optionele plaatsnaam
}

export interface QuickStartSessionInfo {
  family: string;
  familyLabel: string;
  targetLevel: UserLevel;
  verdict?: 'plausibel' | 'twijfelachtig' | 'onwaarschijnlijk' | null;
  feedback?: string | null;
  used: boolean;
}

export interface DeterminationSession {
  id?: number;
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';

  // Progressie velden
  level?: UserLevel;          // Op welk niveau gespeeld
  isSandbox?: boolean;        // Vrij spelen (telt niet mee)
  hintsUsed?: number;         // Aantal hints gebruikt
  quickStart?: QuickStartSessionInfo;

  input: {
    type: 'photo' | 'video' | 'multi-photo';
    // Enkelvoudige foto/video (backwards compatible)
    blob?: Blob;
    thumbnail?: string;
    // Meerdere foto's
    images?: LabeledImage[];
    // Video
    videoBlob?: Blob;
    videoDuration?: number;
    // Vindplaats
    locatie?: VondstLocatie;
  };

  steps: DeterminationStep[];

  result?: {
    type: string;
    sourceResultType?: string;
    category?: string;
    description?: string;
    period?: string;
    confidence?: 'laag' | 'gemiddeld' | 'hoog';
    characteristics?: string[];
    fullAnalysis?: string; // Volledige AI response
  };

  // AI validatie resultaat
  aiValidation?: {
    verdict: 'correct' | 'twijfelachtig' | 'onjuist';
    feedback: string;
  };

  synced: boolean;
  cloudId?: string;       // UUID van Supabase record
  lastSyncedAt?: string;  // Laatste sync timestamp
}

// Image metadata types
export interface ImageMetadata {
  file: string;
  page: number;
  question: string | null;
  size_kb: number;
  width: number;
  height: number;
}

// Standalone locatie (zonder determinatie)
export interface SavedLocation {
  id?: number;
  createdAt: string;
  updatedAt: string;
  lat: number;
  lng: number;
  naam?: string;                  // Optionele plaatsnaam
  notitie?: string;               // Optionele notitie ("hier ligt veel vuursteen")
  linkedSessionIds: number[];     // Gekoppelde determinatie IDs
  cloudId?: string;
  lastSyncedAt?: string;
}

// Progressie systeem types
export type UserLevel = 'beginner' | 'gevorderd' | 'expert';

export interface LevelStats {
  attempts: number;
  correct: number;
  hintsUsed: number;
  averageTime: number; // milliseconds per sessie
  lastPlayed: string | null;
}

export interface UserProfile {
  id: string;
  createdAt: string;
  currentLevel: UserLevel;
  unlockedLevels: UserLevel[];

  // Progressie tracking
  totalCorrect: number;          // AI-correct verdicts
  totalAttempts: number;         // Totaal aantal determinaties
  docentValidations: number;     // Aantal docent goedkeuringen

  // Stats per niveau
  stats: {
    beginner: LevelStats;
    gevorderd: LevelStats;
    expert: LevelStats;
  };

  // Category mastery (optioneel voor later)
  categoryScores: Record<string, { correct: number; total: number }>;
}

// Feedback per stap (voor gevorderd modus)
export interface StepFeedback {
  questionId: string;
  wasCorrect: boolean;
  correctAnswer?: 'ja' | 'nee';
  explanation?: string;
}
