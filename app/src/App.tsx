import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageCapture } from './components/ImageCapture';
import { AIAnalysis } from './components/AIAnalysis';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { WelcomeModal, useWelcomeModal } from './components/WelcomeModal';
import { SettingsMenu } from './components/SettingsMenu';
import { Sidebar } from './components/Sidebar';
import { createSession, completeSession, getSession } from './lib/db';
import type { DeterminationSession, LabeledImage } from './types';
import type { AnalysisResult } from './lib/aiAnalysis';

type View = 'capture' | 'analyze' | 'result' | 'history';

const APP_VERSION = '1.4.23';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.2,
};

interface CapturedData {
  type: 'photo' | 'video' | 'multi-photo';
  blob?: Blob;
  thumbnail?: string;
  images?: LabeledImage[];
  videoBlob?: Blob;
  videoFrames?: LabeledImage[]; // Automatisch geëxtraheerde frames uit video
  locatie?: { lat: number; lng: number; naam?: string };
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
      locatie: data.locatie,
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
      locatie: session.input.locatie,
    };

    // Maak nieuwe sessie met dezelfde input
    const sessionId = await createSession({
      type: data.type,
      blob: data.blob,
      thumbnail: data.thumbnail,
      images: data.images,
      videoBlob: data.videoBlob,
      locatie: data.locatie,
    });

    setCurrentSessionId(sessionId);
    setCapturedData(data);
    setView('analyze');
  }, []);

  const handleNavigate = useCallback((newView: 'capture' | 'history') => {
    setView(newView);
  }, []);

  // Render current view content
  const renderContent = () => {
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

    if (view === 'history') {
      return <HistoryView onBack={handleBack} onSelectSession={handleSelectSession} />;
    }

    // Default: capture
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Mobile header - hidden on desktop */}
        <header className="lg:hidden shrink-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide">STEENTIJD</h1>
                <p className="text-[10px] text-white/70 -mt-0.5">Determineren van artefacten</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView('history')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="hidden xs:inline">Opgeslagen</span>
              </button>
              <SettingsMenu onShowWelcome={welcomeModal.open} version={APP_VERSION} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <ImageCapture onCapture={handleCapture} />
        </div>
      </div>
    );
  };

  return (
    <div className="desktop-layout">
      {/* Desktop Sidebar */}
      <Sidebar
        currentView={view}
        onNavigate={handleNavigate}
        onShowWelcome={welcomeModal.open}
      />

      {/* Main content area */}
      <main className="desktop-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Welcome Modal */}
      {welcomeModal.isOpen && <WelcomeModal onClose={welcomeModal.close} />}
    </div>
  );
}

export default App;
