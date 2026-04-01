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
  BookOpen,
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
    version: '2.2.14',
    title: 'Meer vervolgkaarten gedicht',
    items: [
      'Geretoucheerde afslagen en meerdere kernwerktuigen geven nu ook een vervolgkaart',
      'Artefacttypen zonder eigen gevorderd-subboom lopen voorlopig door naar Expert',
      'De vervolgkaartlaag sluit nu beter aan op de feitelijke AWN-verdieping in de app',
    ],
  },
  {
    version: '2.2.13',
    title: 'Kernverdieping gekoppeld',
    items: [
      'Kernuitkomsten zoals klingkern, afslagkern en Levallois-kern geven nu een vervolgkaart',
      'Voor deze groepen gaat de vervolgroute direct naar Expert, omdat daar nu de volledige AWN-boom zit',
      'Vervolgknoppen tonen nu het juiste doelniveau in plaats van altijd Gevorderd',
    ],
  },
  {
    version: '2.2.12',
    title: 'Expert doorgroei aangescherpt',
    items: [
      'Expert unlock telt nu alleen correcte determinaties op gevorderd niveau mee',
      'Docenten kunnen gebruikers nog steeds direct naar expert promoveren',
      'Voortgangsteksten en balken tonen nu dezelfde expertregel als de unlocklogica',
    ],
  },
  {
    version: '2.2.11',
    title: 'Niveaulogica opgeschoond',
    items: [
      'Achterhaalde beginner-cutoff restanten verwijderd',
      'Expertfase staat nu overal als actief in plaats van gepland',
      'Unlock-uitleg verduidelijkt: reguliere doorgroei vereist correcte determinaties en docentvalidaties',
    ],
  },
  {
    version: '2.2.10',
    title: 'Wijzigingenbeheer bijgewerkt',
    items: [
      'Recente AWN-versies zijn toegevoegd aan "Wat is nieuw?"',
      'Release-overzicht sluit nu beter aan op de live V2-uitrol',
    ],
  },
  {
    version: '2.2.9',
    title: 'Echt resultaat op beginniveau',
    items: [
      'Beginner toont nu het echte resultaat in plaats van "Onbepaald (beginnersniveau bereikt)"',
      'Verborgen vervolgresultaten blijven beschikbaar voor latere verdieping',
      'Kern- en andere beginneruitkomsten zijn daardoor logischer leesbaar',
    ],
  },
  {
    version: '2.2.8',
    title: 'Vervolg na beginner cutoff',
    items: [
      'Verborgen beginnerresultaten bewaren nu het echte onderliggende type',
      'Vervolgknoppen kunnen daardoor ook werken na een beginner cutoff',
      'Overgang van beginner naar gevorderde verdieping is betrouwbaarder gemaakt',
    ],
  },
  {
    version: '2.2.7',
    title: 'Testinformatie voor AWN',
    items: [
      'Nieuwe uitleg- en testinformatie op het startscherm',
      'Heldere beschrijving van niveaus, training, vrij spelen en potentie',
      'Expertboom en AWN-fases beter uitlegbaar voor testers',
    ],
  },
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
    version: '2.2.4',
    title: 'AWN testfase 3',
    items: [
      'Vuistbijlen kregen een eerste subtypeboom op gevorderd niveau',
      'Bifaciale werktuigen zijn als aparte AWN-testfase toegevoegd',
      'Eerste handmatige testpaden voor vuistbijlverdieping zijn vastgelegd',
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
              totalCorrect={profile.stats.gevorderd.correct}
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

          <button
            onClick={() => setShowInfo(true)}
            className="w-full bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen size={22} className="text-amber-700" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-stone-800">Uitleg & testinformatie</h3>
                <p className="text-xs text-stone-500">
                  Voor AWN-testers, trainers, liefhebbers en geinteresseerden
                </p>
              </div>
            </div>
          </button>
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
                <h2 className="text-xl font-bold">Steentijd v2</h2>
                <p className="text-amber-200 text-sm">Uitleg, testinformatie en ontwikkelrichting</p>
              </div>

              {/* Scrollbare content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Wat deze app doet</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Steentijd is een mobiele determinatie-app voor stenen artefacten op basis van het AWN-determinatie-algoritme.
                    </p>
                    <p>
                      De app is bruikbaar als leeromgeving, als trainingsinstrument en als praktische hulp voor liefhebbers en geinteresseerden die stap voor stap een artefact willen bekijken.
                    </p>
                    <p>
                      V2 combineert een toegankelijke beginnerinstap met verdiepingen op gevorderd niveau en een expertmodus die nu op de volledige AWN-bronboom is gebaseerd.
                    </p>
                  </div>
                </section>

                <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">Niveaus in deze versie</h3>
                  <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                    <p><strong>Beginner</strong> — verkorte, begrijpelijke instapboom met hulp, context en referentiebeelden.</p>
                    <p><strong>Gevorderd</strong> — verdieping op artefactgroepen waar de AWN-bron echt verder uitsplitst, zoals spitsen, schrabbers, vuistbijlen, geslepen en doorboorde werktuigen.</p>
                    <p><strong>Expert</strong> — werkt zonder verkorte beginnerboom en gebruikt de volledige AWN-bronstructuur als basis voor determinatie.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Hoe dit tot stand is gekomen</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      De inhoudelijke basis komt uit het AWN-determinatie-algoritme en de handleiding van de Landelijke Werkgroep Steentijd.
                    </p>
                    <p>
                      De app is eerst opgebouwd als werkbare beginnerboom en daarna gefaseerd uitgebreid met AWN-verdiepingen voor klingen, afslagen, spitsen, schrabbers, bifaciale werktuigen, geslepen werktuigen en doorboorde werktuigen.
                    </p>
                    <p>
                      In deze versie is ook een expertmodus toegevoegd die de volledige AWN-bronboom als uitgangspunt gebruikt.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Doorgroeien en vrij spelen</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Van <strong>Beginner</strong> naar <strong>Gevorderd</strong> groei je door met correcte determinaties en docentvalidaties.
                    </p>
                    <p>
                      Reguliere doorgroei werkt via beide sporen tegelijk: correcte determinaties én docentvalidaties. Een docent kan een gebruiker daarnaast handmatig promoveren.
                    </p>
                    <p>
                      Van <strong>Gevorderd</strong> naar <strong>Expert</strong> groeit de gebruiker verder via 30 correcte determinaties op <strong>gevorderd niveau</strong> en 10 docentvalidaties.
                    </p>
                    <p>
                      Via <strong>Vrij spelen</strong> kun je beginner, gevorderd en expert direct testen zonder dat dit invloed heeft op de opgeslagen voortgang.
                    </p>
                    <p>
                      Daardoor is de app niet alleen bruikbaar voor trainingen, maar ook voor mensen die willen oefenen, verkennen of gewoon interesse hebben in steentijdartefacten.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Training, docent en validatie</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Trainers of docenten kunnen sessies aanmaken, deelnemers laten instromen via code of QR, en determinaties beoordelen in het docentdashboard.
                    </p>
                    <p>
                      Een docent kan determinaties goed- of afkeuren en gebruikers handmatig naar een hoger niveau promoveren.
                    </p>
                    <p>
                      <strong>Belangrijk:</strong> in de huidige V2 is er nog geen aparte <strong>validatorrol</strong>. Die validatie ligt nu bij de docent/trainer. Een losse validatorrol is een logische volgende stap, maar is nog niet apart ingericht in de interface.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">Waar testers op kunnen letten</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Testers kunnen nu zowel de praktische bruikbaarheid als de AWN-logica beoordelen:
                    </p>
                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                      <li>• klopt de beginnerinstap voor nieuwe gebruikers?</li>
                      <li>• verschijnen verdiepingen op logische momenten?</li>
                      <li>• voelt de expertmodus inhoudelijk als de AWN-bronstructuur?</li>
                      <li>• zijn trainer en validatie bruikbaar voor oefen- en lessituaties?</li>
                    </ul>
                  </div>
                </section>

                <section className="rounded-xl p-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
                  <h3 className="text-sm font-semibold mb-2 text-stone-800 dark:text-stone-100">Potentie van deze app</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <p>
                      Deze app kan uitgroeien tot een gedeeld hulpmiddel voor zelfstudie, training, veldgebruik en kwaliteitscontrole rond determinatie.
                    </p>
                    <p>
                      De combinatie van beginnerinstap, expertverdieping, trainingssessies, validatie, kaartfuncties en opgeslagen determinaties maakt het mogelijk om zowel onderwijs als praktijk te ondersteunen.
                    </p>
                    <p>
                      Voor liefhebbers en geinteresseerden is de app al bruikbaar als begeleide kennismaking met het determineren van steentijdartefacten, ook zonder directe toegang tot trainingssessies.
                    </p>
                  </div>
                </section>

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

                <section className="rounded-xl p-3 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>Let op:</strong> Dit blijft een hulpmiddel. Bij twijfel of bij inhoudelijke discussie hoort de beoordeling uiteindelijk bij de AWN-expertise en niet alleen bij de app.
                  </p>
                </section>

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
