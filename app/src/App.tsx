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
      <div className="min-h-screen flex flex-col">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Steentijd</h1>
          <p className="text-amber-100">Determinatie App</p>
          <p className="text-sm text-amber-200 mt-4">
            Herken en determineer stenen artefacten
          </p>
        </div>

        {/* Info */}
        <div className="p-4 flex-1">
          <div className="card mb-4">
            <h2 className="font-semibold text-lg mb-2">Hoe werkt het?</h2>
            <ol className="text-sm text-stone-600 space-y-2">
              <li className="flex gap-2">
                <span className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <span>Maak een foto van het artefact</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <span>Beantwoord de vragen over kenmerken</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <span>Ontvang de determinatie met uitleg</span>
              </li>
            </ol>
          </div>

          <div className="card">
            <p className="text-xs text-stone-500">
              Gebaseerd op het Algoritme Typebepaling (Vuur-)Stenen Artefacten
              van de Landelijke Werkgroep Steentijd (AWN)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-stone-200 flex gap-4">
          <button onClick={() => setView('history')} className="btn-secondary flex-1">
            Geschiedenis
          </button>
          <button onClick={() => setView('capture')} className="btn-primary flex-1">
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
