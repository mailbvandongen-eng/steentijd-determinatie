import { useState, useCallback } from 'react';
import { ImageCapture } from './components/ImageCapture';
import { AIAnalysis } from './components/AIAnalysis';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { WelcomeModal, useWelcomeModal } from './components/WelcomeModal';
import { SettingsMenu } from './components/SettingsMenu';
import { createSession, completeSession, getSession } from './lib/db';
import type { DeterminationSession, LabeledImage } from './types';
import type { AnalysisResult } from './lib/aiAnalysis';

type View = 'home' | 'capture' | 'analyze' | 'result' | 'history';

const APP_VERSION = '1.0.12';

interface CapturedData {
  type: 'photo' | 'video' | 'multi-photo';
  blob?: Blob;
  thumbnail?: string;
  images?: LabeledImage[];
  videoBlob?: Blob;
  videoFrames?: LabeledImage[]; // Automatisch geëxtraheerde frames uit video
}

function App() {
  const [view, setView] = useState<View>('home');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<DeterminationSession | null>(null);
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const welcomeModal = useWelcomeModal();

  const handleCapture = useCallback(async (data: CapturedData) => {
    // Maak nieuwe sessie
    const sessionId = await createSession({
      type: data.type,
      blob: data.blob,
      thumbnail: data.thumbnail,
      images: data.images,
      videoBlob: data.videoBlob,
    });
    setCurrentSessionId(sessionId);
    setCapturedData(data);
    setView('analyze');
  }, []);

  const handleAnalysisComplete = useCallback(
    async (result: {
      type: string;
      description: string;
      period?: string;
      confidence?: 'laag' | 'gemiddeld' | 'hoog';
      characteristics?: string[];
      aiAnalysis: AnalysisResult;
    }) => {
      if (currentSessionId) {
        await completeSession(currentSessionId, {
          type: result.type,
          description: result.description,
          period: result.period,
          confidence: result.confidence,
          characteristics: result.characteristics,
          fullAnalysis: result.aiAnalysis.description,
        });
        const session = await getSession(currentSessionId);
        if (session) {
          setCurrentSession(session);
          setView('result');
        }
      }
    },
    [currentSessionId]
  );

  const handleNewDetermination = useCallback(() => {
    setCurrentSessionId(null);
    setCurrentSession(null);
    setCapturedData(null);
    setView('capture');
  }, []);

  const handleSelectSession = useCallback((session: DeterminationSession) => {
    setCurrentSession(session);
    setView('result');
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
  }, []);

  const handleBackFromAnalysis = useCallback(() => {
    // Terug naar capture, sessie annuleren
    setCurrentSessionId(null);
    setCapturedData(null);
    setView('capture');
  }, []);

  // Home screen
  if (view === 'home') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-6 text-center shrink-0 relative">
          <div className="absolute right-2 top-2">
            <SettingsMenu onShowWelcome={welcomeModal.open} />
          </div>
          <h1 className="text-3xl font-bold">Steentijd</h1>
          <p className="text-amber-200">AI Determinatie</p>
        </div>

        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <button
            onClick={() => setView('capture')}
            className="w-32 h-32 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
          >
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">Start</span>
          </button>

          <button
            onClick={() => setView('history')}
            className="mt-6 text-stone-500 hover:text-stone-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Geschiedenis
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 text-center shrink-0">
          <p className="text-xs text-stone-400">AWN Landelijke Werkgroep Steentijd</p>
          <p className="text-xs text-stone-300">v{APP_VERSION}</p>
        </div>

        {/* Welcome Modal */}
        {welcomeModal.isOpen && <WelcomeModal onClose={welcomeModal.close} />}
      </div>
    );
  }

  // Capture screen
  if (view === 'capture') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="bg-stone-800 p-4 flex items-center gap-3 shrink-0">
          <button onClick={handleBack} className="text-white p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-lg font-semibold">Nieuwe determinatie</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ImageCapture onCapture={handleCapture} />
        </div>
      </div>
    );
  }

  // AI Analysis screen
  if (view === 'analyze' && capturedData) {
    return (
      <AIAnalysis
        images={capturedData.images || []}
        singleImage={capturedData.blob && capturedData.thumbnail ? {
          blob: capturedData.blob,
          thumbnail: capturedData.thumbnail,
        } : undefined}
        videoFrames={capturedData.videoFrames}
        onComplete={handleAnalysisComplete}
        onBack={handleBackFromAnalysis}
      />
    );
  }

  // Result screen
  if (view === 'result' && currentSession) {
    return (
      <ResultView
        session={currentSession}
        onNewDetermination={handleNewDetermination}
        onViewHistory={() => setView('history')}
      />
    );
  }

  // History screen
  if (view === 'history') {
    return <HistoryView onBack={handleBack} onSelectSession={handleSelectSession} />;
  }

  return null;
}

export default App;
