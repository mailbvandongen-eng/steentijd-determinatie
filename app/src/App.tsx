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

const APP_VERSION = '1.0.20';

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

  // Capture screen (main screen)
  if (view === 'capture') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="bg-stone-900 px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-stone-900 px-2 py-0.5 font-black text-sm tracking-tight">STEENTIJD</div>
            <span className="text-stone-400 text-xs">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setView('history')}
              className="text-stone-400 hover:text-white px-2 py-1 text-xs uppercase tracking-wide"
            >
              Opgeslagen
            </button>
            <SettingsMenu onShowWelcome={welcomeModal.open} />
          </div>
        </div>
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
