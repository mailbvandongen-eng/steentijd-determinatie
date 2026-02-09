import { useState, useCallback } from 'react';
import { ImageCapture } from './components/ImageCapture';
import { DecisionNavigator } from './components/DecisionNavigator';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { createSession, addStep, completeSession, getSession } from './lib/db';
import type { DeterminationSession, DeterminationStep } from './types';

type View = 'home' | 'capture' | 'determine' | 'result' | 'history';

function App() {
  const [view, setView] = useState<View>('home');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<DeterminationSession | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleCapture = useCallback(async (blob: Blob, thumbnail: string) => {
    // Maak nieuwe sessie
    const sessionId = await createSession({
      type: 'photo',
      blob,
      thumbnail,
    });
    setCurrentSessionId(sessionId);
    setImageUrl(thumbnail);
    setView('determine');
  }, []);

  const handleStep = useCallback(
    async (step: DeterminationStep) => {
      if (currentSessionId) {
        await addStep(currentSessionId, step);
      }
    },
    [currentSessionId]
  );

  const handleComplete = useCallback(
    async (result: { type: string; description?: string }) => {
      if (currentSessionId) {
        await completeSession(currentSessionId, result);
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
    setImageUrl(null);
    setView('capture');
  }, []);

  const handleSelectSession = useCallback((session: DeterminationSession) => {
    setCurrentSession(session);
    setView('result');
  }, []);

  const handleBack = useCallback(() => {
    setView('home');
  }, []);

  // Home screen
  if (view === 'home') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Hero - compact */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center shrink-0">
          <h1 className="text-2xl font-bold">Steentijd</h1>
          <p className="text-amber-200 text-sm">Determineer stenen artefacten</p>
        </div>

        {/* Info - scrollable */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="card mb-3">
            <h2 className="font-semibold mb-2">Hoe werkt het?</h2>
            <ol className="text-sm text-stone-600 space-y-1">
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Maak een foto van het artefact</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Beantwoord vragen over kenmerken</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="bg-amber-100 text-amber-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Ontvang de determinatie</span>
              </li>
            </ol>
          </div>

          <p className="text-xs text-stone-400 text-center">
            AWN Landelijke Werkgroep Steentijd
          </p>
        </div>

        {/* Actions - fixed at bottom */}
        <div className="p-3 bg-white border-t border-stone-200 flex gap-3 shrink-0">
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
      <div className="min-h-screen flex flex-col">
        <div className="bg-stone-800 p-4 flex items-center gap-3">
          <button onClick={handleBack} className="text-white p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-lg font-semibold">Nieuwe determinatie</h1>
        </div>
        <div className="flex-1">
          <ImageCapture onCapture={handleCapture} />
        </div>
      </div>
    );
  }

  // Determination screen
  if (view === 'determine' && imageUrl) {
    return (
      <DecisionNavigator
        imageUrl={imageUrl}
        onStep={handleStep}
        onComplete={handleComplete}
        onBack={handleBack}
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
