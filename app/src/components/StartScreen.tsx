import { useState } from 'react';

interface StartScreenProps {
  onStartPractice: () => void;
  onStartTraining: (sessionCode: string, name: string) => void;
  onOpenTrainerDashboard: () => void;
  isLoggedIn: boolean;
  version: string;
}

export function StartScreen({ onStartPractice, onStartTraining, onOpenTrainerDashboard, isLoggedIn, version }: StartScreenProps) {
  const [mode, setMode] = useState<'select' | 'join-training'>('select');
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoinTraining = () => {
    if (!sessionCode.trim()) {
      setError('Vul een sessiecode in');
      return;
    }
    if (!name.trim()) {
      setError('Vul je naam in');
      return;
    }
    setError('');
    onStartTraining(sessionCode.trim().toUpperCase(), name.trim());
  };

  if (mode === 'join-training') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Training Deelnemen</h1>
              <p className="text-sm text-white/70">Scan QR of vul code in</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Sessiecode
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="bijv. AWN-2024-MAART"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg font-mono tracking-wider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Je naam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hoe heet je?"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleJoinTraining}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Deelnemen
            </button>
          </div>

          <p className="text-center text-stone-500 text-sm mt-6">
            Vraag je docent om de sessiecode of scan de QR-code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-8 shadow-lg">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center tracking-wide">STEENTIJD</h1>
        <p className="text-center text-white/80 mt-1">Determineren van artefacten</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-4">
          {/* Practice Mode */}
          <button
            onClick={onStartPractice}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">Oefenen</h2>
                <p className="text-stone-600 mt-1">
                  Zelfstandig determineren in eigen tempo. Perfect voor in het veld of thuis oefenen.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">Geen login nodig</span>
                  <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">AI-hints beschikbaar</span>
                </div>
              </div>
            </div>
          </button>

          {/* Training Mode */}
          <button
            onClick={() => setMode('join-training')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">Training</h2>
                <p className="text-stone-600 mt-1">
                  Deelnemen aan een AWN training. Je docent kan live meekijken en feedback geven.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">QR-code scannen</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Live feedback</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Docent Link */}
      <div className="px-4 mb-2">
        <button
          onClick={onOpenTrainerDashboard}
          className="w-full max-w-md mx-auto block text-center py-3 text-stone-600 hover:text-amber-700 transition-colors"
        >
          {isLoggedIn ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Docent Dashboard
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Docent? Login hier
            </span>
          )}
        </button>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-stone-400 text-sm">
          v{version} - AWN Steentijdwerkgroep
        </p>
      </footer>
    </div>
  );
}
