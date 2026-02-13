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

type View = 'capture' | 'analyze' | 'result' | 'history';

const APP_VERSION = '1.1.3';

interface CapturedData {
  type: 'photo' | 'video' | 'multi-photo';
  blob?: Blob;
  thumbnail?: string;
  images?: LabeledImage[];
  videoBlob?: Blob;
  videoFrames?: LabeledImage[]; // Automatisch geëxtraheerde frames uit video
}

function App() {
  const [view, setView] = useState<View>('capture');
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
    setView('capture');
  }, []);

  const handleBackFromAnalysis = useCallback(() => {
    // Terug naar capture, sessie annuleren
    setCurrentSessionId(null);
    setCapturedData(null);
    setView('capture');
  }, []);

  const handleRedeterminate = useCallback(async (session: DeterminationSession) => {
    // Laad de foto's uit de bestaande sessie en ga naar analyse
    const data: CapturedData = {
      type: session.input.type,
      images: session.input.images,
      blob: session.input.blob,
      thumbnail: session.input.thumbnail,
      videoBlob: session.input.videoBlob,
    };

    // Maak nieuwe sessie met dezelfde input
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

  // Capture screen (main screen)
  if (view === 'capture') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shrink-0">
          <div>
            <span className="text-lg font-bold tracking-tight block">STEENTIJD</span>
            <span className="text-xs opacity-80">Determineren van artefacten</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('history')}
              className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Opgeslagen</span>
            </button>
            <SettingsMenu onShowWelcome={welcomeModal.open} version={APP_VERSION} />
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <ImageCapture onCapture={handleCapture} />
        </div>
        {/* Welcome Modal */}
        {welcomeModal.isOpen && <WelcomeModal onClose={welcomeModal.close} />}
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
        onRedeterminate={handleRedeterminate}
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
