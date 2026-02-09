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

export interface DeterminationSession {
  id?: number;
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';

  input: {
    type: 'photo' | 'video';
    blob?: Blob;
    thumbnail?: string;
  };

  steps: DeterminationStep[];

  result?: {
    type: string;
    category?: string;
    description?: string;
  };

  synced: boolean;
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
