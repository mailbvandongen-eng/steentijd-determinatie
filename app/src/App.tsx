import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StartScreen } from './components/StartScreen';
import { ImageCapture } from './components/ImageCapture';
import { DecisionNavigator } from './components/DecisionNavigator';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { WelcomeModal, useWelcomeModal } from './components/WelcomeModal';
import { SettingsMenu } from './components/SettingsMenu';
import { createSession, completeSession, getSession } from './lib/db';
import type { DeterminationSession, LabeledImage, DeterminationStep } from './types';

type View = 'start' | 'capture' | 'decision' | 'result' | 'history';
type AppMode = 'practice' | 'training';

const APP_VERSION = '2.0.0';

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
  videoFrames?: LabeledImage[];
  locatie?: { lat: number; lng: number; naam?: string };
}

interface TrainingSession {
  code: string;
  participantName: string;
}

function App() {
  const [view, setView] = useState<View>('start');
  const [appMode, setAppMode] = useState<AppMode>('practice');
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<DeterminationSession | null>(null);
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const [determinationSteps, setDeterminationSteps] = useState<DeterminationStep[]>([]);
  const welcomeModal = useWelcomeModal();

  // Start handlers
  const handleStartPractice = useCallback(() => {
    setAppMode('practice');
    setTrainingSession(null);
    setView('capture');
  }, []);

  const handleStartTraining = useCallback((sessionCode: string, name: string) => {
    setAppMode('training');
    setTrainingSession({ code: sessionCode, participantName: name });
    setView('capture');
    // TODO: Connect to Firestore training session
  }, []);

  // Capture handler
  const handleCapture = useCallback(async (data: CapturedData) => {
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
    setDeterminationSteps([]);
    setView('decision');
  }, []);

  // Decision tree handlers
  const handleDecisionStep = useCallback((step: DeterminationStep) => {
    setDeterminationSteps((prev) => [...prev, step]);
    // TODO: In training mode, sync step to Firestore
  }, []);

  const handleDecisionComplete = useCallback(
    async (result: { type: string; description?: string }) => {
      if (currentSessionId) {
        await completeSession(
          currentSessionId,
          {
            type: result.type,
            description: result.description || '',
          },
          determinationSteps
        );
        const session = await getSession(currentSessionId);
        if (session) {
          setCurrentSession(session);
          setView('result');
        }
      }
    },
    [currentSessionId, determinationSteps]
  );

  // Navigation handlers
  const handleNewDetermination = useCallback(() => {
    setCurrentSessionId(null);
    setCurrentSession(null);
    setCapturedData(null);
    setDeterminationSteps([]);
    setView('capture');
  }, []);

  const handleSelectSession = useCallback((session: DeterminationSession) => {
    setCurrentSession(session);
    setView('result');
  }, []);

  const handleBackFromCapture = useCallback(() => {
    setView('start');
  }, []);

  const handleBackFromDecision = useCallback(() => {
    setCurrentSessionId(null);
    setCapturedData(null);
    setDeterminationSteps([]);
    setView('capture');
  }, []);

  const handleRedeterminate = useCallback(async (session: DeterminationSession) => {
    const data: CapturedData = {
      type: session.input.type,
      images: session.input.images,
      blob: session.input.blob,
      thumbnail: session.input.thumbnail,
      videoBlob: session.input.videoBlob,
      locatie: session.input.locatie,
    };

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
    setDeterminationSteps([]);
    setView('decision');
  }, []);

  // Get image URL for decision navigator
  const getImageUrl = (): string => {
    if (capturedData?.thumbnail) {
      return capturedData.thumbnail;
    }
    if (capturedData?.images?.[0]?.thumbnail) {
      return capturedData.images[0].thumbnail;
    }
    return '';
  };

  // Render current view content
  const renderContent = () => {
    if (view === 'start') {
      return (
        <StartScreen
          onStartPractice={handleStartPractice}
          onStartTraining={handleStartTraining}
          version={APP_VERSION}
        />
      );
    }

    if (view === 'decision' && capturedData) {
      return (
        <DecisionNavigator
          imageUrl={getImageUrl()}
          onStep={handleDecisionStep}
          onComplete={handleDecisionComplete}
          onBack={handleBackFromDecision}
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
      return (
        <HistoryView
          onBack={() => setView('capture')}
          onSelectSession={handleSelectSession}
        />
      );
    }

    // Default: capture
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackFromCapture}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide">
                  {appMode === 'training' ? 'TRAINING' : 'OEFENEN'}
                </h1>
                <p className="text-[10px] text-white/70 -mt-0.5">
                  {appMode === 'training' && trainingSession
                    ? `${trainingSession.code} - ${trainingSession.participantName}`
                    : 'Maak een foto van je artefact'}
                </p>
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
    <div className="h-screen w-screen overflow-hidden bg-stone-100">
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

      {/* Welcome Modal */}
      {welcomeModal.isOpen && <WelcomeModal onClose={welcomeModal.close} />}
    </div>
  );
}

export default App;
