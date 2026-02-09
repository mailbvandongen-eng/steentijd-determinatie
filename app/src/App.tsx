import { useState, useCallback } from 'react';
import { ImageCapture } from './components/ImageCapture';
import { AIAnalysis } from './components/AIAnalysis';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { createSession, completeSession, getSession } from './lib/db';
import type { DeterminationSession, LabeledImage } from './types';
import type { AnalysisResult } from './lib/aiAnalysis';

type View = 'home' | 'capture' | 'analyze' | 'result' | 'history';

const APP_VERSION = '1.0.4';

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
    async (result: { type: string; description: string; aiAnalysis: AnalysisResult }) => {
      if (currentSessionId) {
        await completeSession(currentSessionId, {
          type: result.type,
          description: result.description,
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
        {/* Hero - compact */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center shrink-0">
          <h1 className="text-2xl font-bold">Steentijd</h1>
          <p className="text-amber-200 text-sm">AI Determinatie van stenen artefacten</p>
        </div>

        {/* Info - scrollable */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="card mb-3">
            <h2 className="font-semibold mb-2">Hoe werkt het?</h2>
            <ol className="text-sm text-stone-600 space-y-1">
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Maak foto's van het artefact</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>AI analyseert het object</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Ontvang type, periode en beschrijving</span>
              </li>
            </ol>
          </div>

          <div className="card mb-3 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>AI-powered</strong><br />
              Gebruikt Claude AI met kennis van het AWN determinatie-algoritme voor nauwkeurige analyse.
            </p>
          </div>

          <p className="text-xs text-stone-400 text-center">
            AWN Landelijke Werkgroep Steentijd
          </p>
          <p className="text-xs text-stone-300 text-center mt-2">
            v{APP_VERSION}
          </p>
        </div>

        {/* Actions - fixed at bottom with safe area */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 flex gap-3 shrink-0">
          <button onClick={() => setView('history')} className="btn-secondary flex-1 py-3">
            Geschiedenis
          </button>
          <button onClick={() => setView('capture')} className="btn-primary flex-1 py-3">
            Start
          </button>
        </div>
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
