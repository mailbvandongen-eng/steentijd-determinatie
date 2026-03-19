import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { LevelSelector } from './LevelSelector';
import { ProgressBar } from './ProgressBar';
import type { UserLevel } from '../types';

interface StartScreenProps {
  onStartPractice: (level: UserLevel, isSandbox: boolean) => void;
  onStartTraining: (sessionCode: string, name: string) => void;
  onOpenTrainerDashboard: () => void;
  onViewHistory: () => void;
  isLoggedIn: boolean;
  version: string;
  initialJoinCode?: string | null;
  onJoinCodeUsed?: () => void;
}

export function StartScreen({
  onStartPractice,
  onStartTraining,
  onOpenTrainerDashboard,
  onViewHistory,
  isLoggedIn,
  version,
  initialJoinCode,
  onJoinCodeUsed
}: StartScreenProps) {
  const { profile, currentLevel, setCurrentLevel, isLevelUnlocked, progress } = useUser();

  // If we have an initial join code from URL, start in join-training mode
  const [mode, setMode] = useState<'main' | 'join-training'>(initialJoinCode ? 'join-training' : 'main');
  const [sessionCode, setSessionCode] = useState(initialJoinCode || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showSandboxOption, setShowSandboxOption] = useState(false);

  // Clear the initial join code after it's been used
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
    if (onJoinCodeUsed) onJoinCodeUsed();
    onStartTraining(sessionCode.trim().toUpperCase(), name.trim());
  };

  // Training deelnemen scherm
  if (mode === 'join-training') {
    return (
      <div className="h-full bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">
          <button
            onClick={() => setMode('main')}
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

  // Hoofd startscherm
  return (
    <div className="h-full bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col overflow-auto">
      {/* Header */}
      <header className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"/>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center tracking-wide">STEENTIJD</h1>
        <p className="text-center text-white/80 text-sm mt-1">Leer artefacten herkennen</p>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="max-w-md mx-auto w-full space-y-4">

          {/* Niveau Selector */}
          <LevelSelector
            currentLevel={currentLevel}
            unlockedLevels={profile.unlockedLevels}
            onSelectLevel={setCurrentLevel}
          />

          {/* Voortgangsbalk naar Gevorderd (alleen tonen als nog niet ontgrendeld) */}
          <ProgressBar
            correctProgress={progress.correctProgress}
            validationProgress={progress.validationProgress}
            totalCorrect={profile.totalCorrect}
            totalValidations={profile.docentValidations}
            correctNeeded={progress.correctNeeded}
            validationsNeeded={progress.validationsNeeded}
            isUnlocked={isLevelUnlocked('gevorderd')}
          />

          {/* Hoofdactie: Start Determinatie */}
          <div className="space-y-2">
            <button
              onClick={() => onStartPractice(currentLevel, false)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-xl p-5 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Start Determinatie</h2>
                  <p className="text-white/80 text-sm">
                    {currentLevel === 'beginner' ? 'Met hints en hulp' : 'Zelfstandig determineren'}
                  </p>
                </div>
              </div>
            </button>

            {/* Vrij Spelen optie */}
            <button
              onClick={() => setShowSandboxOption(!showSandboxOption)}
              className="w-full text-center text-sm text-stone-500 hover:text-amber-600 transition-colors py-1"
            >
              {showSandboxOption ? '▲ Verberg opties' : '▼ Vrij spelen (zonder voortgang)'}
            </button>

            {showSandboxOption && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <p className="text-xs text-stone-500 mb-2">
                  Oefen op elk niveau zonder dat het meetelt voor je voortgang.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartPractice('beginner', true)}
                    className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    🌱 Beginner
                  </button>
                  <button
                    onClick={() => onStartPractice('gevorderd', true)}
                    className="flex-1 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                  >
                    🌿 Gevorderd
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secundaire acties */}
          <div className="flex gap-3">
            {/* Geschiedenis */}
            <button
              onClick={onViewHistory}
              className="flex-1 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-stone-700">Geschiedenis</span>
              </div>
            </button>

            {/* Training */}
            <button
              onClick={() => setMode('join-training')}
              className="flex-1 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-stone-700">Training</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Docent Link */}
      <div className="px-4 mb-2">
        <button
          onClick={onOpenTrainerDashboard}
          className="w-full max-w-md mx-auto block text-center py-3 text-stone-500 hover:text-amber-700 transition-colors text-sm"
        >
          {isLoggedIn ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Docent Dashboard
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <p className="text-stone-400 text-xs">
          v{version} - AWN Steentijdwerkgroep
        </p>
      </footer>
    </div>
  );
}
