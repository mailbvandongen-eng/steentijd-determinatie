import { useState } from 'react';
import {
  Camera,
  ArrowLeft,
  Archive,
  GraduationCap,
  Settings,
  LogIn,
  ChevronUp,
  ChevronDown,
  Sprout,
  Leaf,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { isAdmin } = useAuth();

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
            <ArrowLeft size={20} />
            Terug
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={28} />
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
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            <img
              src="/steentijd.jpg"
              alt="Vuursteen pijlpunt"
              className="w-full h-full object-contain"
            />
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
                  <Camera size={28} />
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
              className="w-full flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-amber-600 transition-colors py-1"
            >
              {showSandboxOption
                ? <><ChevronUp size={14} /> Verberg opties</>
                : <><ChevronDown size={14} /> Vrij spelen (zonder voortgang)</>
              }
            </button>

            {showSandboxOption && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <p className="text-xs text-stone-500 mb-2">
                  Oefen op elk niveau zonder dat het meetelt voor je voortgang.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartPractice('beginner', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <Sprout size={14} /> Beginner
                  </button>
                  <button
                    onClick={() => onStartPractice('gevorderd', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                  >
                    <Leaf size={14} /> Gevorderd
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
                  <Archive size={24} className="text-stone-600" />
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
                  <GraduationCap size={24} className="text-amber-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">Training</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Docent Link — toon alleen als niet ingelogd, of als admin */}
      {(!isLoggedIn || isAdmin) && (
        <div className="px-4 mb-2">
          <button
            onClick={onOpenTrainerDashboard}
            className="w-full max-w-md mx-auto block text-center py-3 text-stone-500 hover:text-amber-700 transition-colors text-sm"
          >
            {isLoggedIn && isAdmin ? (
              <span className="flex items-center justify-center gap-2">
                <Settings size={16} />
                Docent Dashboard
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn size={16} />
                Docent inloggen
              </span>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-stone-400 text-xs">
          v{version} - AWN Steentijdwerkgroep
        </p>
      </footer>
    </div>
  );
}
