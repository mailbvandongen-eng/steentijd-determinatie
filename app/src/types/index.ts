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
  label: 'dorsaal' | 'ventraal' | 'zijkant' | 'extra';
  blob: Blob;
  thumbnail: string;
}

export interface DeterminationSession {
  id?: number;
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';

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
  };

  steps: DeterminationStep[];

  result?: {
    type: string;
    category?: string;
    description?: string;
    period?: string;
    confidence?: 'laag' | 'gemiddeld' | 'hoog';
    characteristics?: string[];
    fullAnalysis?: string; // Volledige AI response
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
