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
  Star,
  Info,
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

const CHANGELOG = [
  {
    version: '2.2.6',
    title: 'AWN expertboom',
    items: [
      'Expert start nu in een volledige AWN-bronboommodus',
      'Branchlabels springen door naar grotere AWN-secties',
      'Bronvragen uit de 511-knooppuntenboom zijn nu runtime beschikbaar',
    ],
  },
  {
    version: '2.2.5',
    title: 'AWN testfase 4-5',
    items: [
      'Geslepen werktuigen krijgen vervolgknoppen',
      'Doorboorde werktuigen en hamerbijlen zijn verdiept',
      'Fase 4 en 5 van het AWN-progressieplan zijn geactiveerd',
    ],
  },
  {
    version: '2.2.3',
    title: 'AWN testfase 2',
    items: [
      'Spitsen krijgen een eerste subtypeboom op gevorderd',
      'Schrabbers krijgen bredere subtypevertakkingen',
      'Fase 2 van het AWN-progressieplan is geactiveerd',
    ],
  },
  {
    version: '2.2.2',
    title: 'AWN testfase 1',
    items: [
      'Eerste vervolgknoppen op beginner-resultaten',
      'Testfase voor klingen en afslagen',
      'AWN-progressieplan vastgelegd voor verdere uitrol',
    ],
  },
  {
    version: '2.3.0',
    title: 'Niveau dropdown & Lucide iconen',
    items: [
      'Niveaukeuze als dropdown (alleen ontgrendelde niveaus)',
      'Alle iconen vervangen door Lucide',
      'Pijlpunt foto als app-icoon',
      'Docent whitelist met e-mailbeveiliging',
    ],
  },
  {
    version: '2.2.0',
    title: 'Gebruikersprofiel & Progressiesysteem',
    items: [
      'Voortgangsbalk naar Gevorderd niveau',
      'Correct/validaties teller',
      'Lokaal opgeslagen profiel',
    ],
  },
  {
    version: '2.1.2',
    title: 'QR code direct join',
    items: ['Scan QR-code om direct een trainingsessie te joinen'],
  },
  {
    version: '2.1.1',
    title: 'Training sessie verbeteringen',
    items: ['Stabiliteit en bugfixes in de trainingsessie'],
  },
  {
    version: '2.1.0',
    title: 'UI Redesign',
    items: ['Educatieve focus', 'Verbeterde mobiele ervaring'],
  },
  {
    version: '2.0.0',
    title: 'Mobiele versie',
    items: ['Volledige herschrijving voor mobiel gebruik'],
  },
];

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
  const { profile, currentLevel, setCurrentLevel, isLevelUnlocked, progress, progressToExpert } = useUser();
  const { isAdmin } = useAuth();

  const [mode, setMode] = useState<'main' | 'join-training'>(initialJoinCode ? 'join-training' : 'main');
  const [sessionCode, setSessionCode] = useState(initialJoinCode || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showSandboxOption, setShowSandboxOption] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleJoinTraining = () => {
    if (!sessionCode.trim()) { setError('Vul een sessiecode in'); return; }
    if (!name.trim()) { setError('Vul je naam in'); return; }
    setError('');
    if (onJoinCodeUsed) onJoinCodeUsed();
    onStartTraining(sessionCode.trim().toUpperCase(), name.trim());
  };

  // Training deelnemen scherm
  if (mode === 'join-training') {
    return (
      <div className="h-full bg-gradient-to-br from-stone-100 to-amber-50 flex flex-col overflow-hidden">
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

        <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Sessiecode</label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="bijv. AWN-2024-MAART"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Je naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hoe heet je?"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-lg"
              />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
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
      <header className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-6 shadow-lg">

        {/* Top-right knoppen */}
        <div className="absolute top-4 right-4 flex gap-1">
          <button
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Info"
          >
            <Info size={18} />
          </button>
          {(!isLoggedIn || isAdmin) && (
            <button
              onClick={onOpenTrainerDashboard}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title={isAdmin ? 'Docent Dashboard' : 'Docent inloggen'}
            >
              {isAdmin ? <Settings size={18} /> : <LogIn size={18} />}
            </button>
          )}
        </div>

        {/* Gecentreerde titel */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            <img src="/steentijd.jpg" alt="Vuursteen pijlpunt" className="w-full h-full object-contain" />
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

          {/* Voortgangsbalk */}
          {isLevelUnlocked('gevorderd') ? (
            <ProgressBar
              correctProgress={progressToExpert.correctProgress}
              validationProgress={progressToExpert.validationProgress}
              totalCorrect={profile.totalCorrect}
              totalValidations={profile.docentValidations}
              correctNeeded={progressToExpert.correctNeeded}
              validationsNeeded={progressToExpert.validationsNeeded}
              isUnlocked={isLevelUnlocked('expert')}
              targetLevel="expert"
              correctTarget={30}
              validationTarget={10}
            />
          ) : (
            <ProgressBar
              correctProgress={progress.correctProgress}
              validationProgress={progress.validationProgress}
              totalCorrect={profile.totalCorrect}
              totalValidations={profile.docentValidations}
              correctNeeded={progress.correctNeeded}
              validationsNeeded={progress.validationsNeeded}
              isUnlocked={false}
              targetLevel="gevorderd"
              correctTarget={20}
              validationTarget={5}
            />
          )}

          {/* Hoofdactie */}
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
                  <button
                    onClick={() => onStartPractice('expert', true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors"
                  >
                    <Star size={14} /> Expert
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secundaire acties */}
          <div className="flex gap-3">
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

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-stone-400 text-xs">v{version} - AWN Steentijdwerkgroep</p>
      </footer>

      {/* Info modal — zelfde stijl als v1 welkomstscherm */}
      {showInfo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[2000]" onClick={() => setShowInfo(false)} />
          <div className="fixed inset-4 z-[2000] flex items-center justify-center pointer-events-none">
            <div
              className="rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md max-h-full pointer-events-auto bg-white dark:bg-stone-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center">
                <h2 className="text-xl font-bold">Over Steentijd</h2>
                <p className="text-amber-200 text-sm">AI-begeleide determinatie van stenen artefacten</p>
              </div>

              {/* Scrollbare content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Hoe werkt het */}
                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Hoe werkt het?</h3>
                  <div className="space-y-3">
                    {[
                      { n: 1, title: "Foto maken", desc: "Maak meerdere foto's van je artefact (voor, achter, zijkanten)" },
                      { n: 2, title: "Beslisboom doorlopen", desc: "Beantwoord stap voor stap vragen over het artefact" },
                      { n: 3, title: "AI-validatie", desc: "De AI beoordeelt je determinatie en geeft feedback" },
                      { n: 4, title: "Niveau opbouwen", desc: "Werk van Beginner naar Gevorderd door oefening en docentvalidaties" },
                    ].map(({ n, title, desc }) => (
                      <div key={n} className="flex gap-3">
                        <div className="w-7 h-7 flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 rounded-full text-sm font-bold shrink-0">
                          {n}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-stone-800 dark:text-stone-100">{title}</h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Niveaus */}
                <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">Niveaus</h3>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• <strong>Beginner</strong> — AI-hints, referentiefoto's en uitleg bij elke vraag</li>
                    <li>• <strong>Gevorderd</strong> — Zelfstandig determineren, geen hints</li>
                    <li>• Ontgrendel Gevorderd met 20 correcte determinaties of 5 docentvalidaties</li>
                  </ul>
                </section>

                {/* AWN */}
                <section className="rounded-xl p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
                  <h3 className="text-sm font-semibold mb-2 text-stone-800 dark:text-stone-100">AWN Werkgroep Steentijd</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    Deze app is gebaseerd op het determinatie-algoritme van de AWN Landelijke Werkgroep Steentijd.
                  </p>
                  <div className="space-y-1">
                    {[
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/", label: "Over de werkgroep" },
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/determinatie/", label: "Determinatie-algoritme" },
                      { href: "https://awn-archeologie.nl/werkgroep/steentijd/vondstkaart/", label: "Vondstkaart Nederland" },
                    ].map(({ href, label }) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        <span className="text-stone-400">→</span>{label}
                      </a>
                    ))}
                  </div>
                </section>

                {/* Disclaimer */}
                <section className="rounded-xl p-3 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>Let op:</strong> Dit is een hulpmiddel. Raadpleeg bij twijfel altijd een expert van de AWN Werkgroep Steentijd.
                  </p>
                </section>

                {/* Changelog */}
                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Wat is nieuw?</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {CHANGELOG.map((entry) => (
                      <div key={entry.version} className="text-xs border-l-2 border-amber-400 dark:border-amber-600 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800 dark:text-stone-100">v{entry.version}</span>
                          <span className="text-stone-400">{entry.title}</span>
                        </div>
                        <ul className="mt-0.5 text-stone-500 dark:text-stone-400">
                          {entry.items.map((item, i) => <li key={i}>• {item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-4 py-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <button
                  onClick={() => setShowInfo(false)}
                  className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
