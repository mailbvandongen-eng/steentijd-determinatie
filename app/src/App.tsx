import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { StartScreen } from './components/StartScreen';
import { ImageCapture } from './components/ImageCapture';
import { DecisionNavigator } from './components/DecisionNavigator';
import { ResultView } from './components/ResultView';
import { HistoryView } from './components/HistoryView';
import { QuickStartReview } from './components/QuickStartReview';

import { SettingsMenu } from './components/SettingsMenu';
import TrainerDashboard from './components/TrainerDashboard';
import { auth, googleProvider } from './lib/firebase';
import { ADMIN_EMAILS } from './lib/adminConfig';
import { createSession, completeSession, getSession } from './lib/db';
import { joinTrainingSession, submitDetermination } from './lib/trainingSession';
import { blobToBase64, checkQuickStartPlausibility } from './lib/aiAnalysis';
import { useAuth } from './contexts/AuthContext';
import type { DeterminationSession, LabeledImage, DeterminationStep, QuickStartSessionInfo, UserLevel } from './types';
import { getContinuationOption, isContinuationActive, type ContinuationOption } from './lib/awnProgression';
import type { DecisionTreeMode } from './lib/decisionTree';
import {
  getQuickStartContinuation,
  getQuickStartDefinition,
  type QuickStartFamily,
} from './lib/quickStart';

type View = 'start' | 'capture' | 'decision' | 'result' | 'history' | 'trainer' | 'quickstart-review';
type AppMode = 'practice' | 'training';

const APP_VERSION = '2.2.85';

interface ContinuationState {
  treeMode: DecisionTreeMode;
  sourceResultType: string;
  startQuestionId?: string;
}

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
  participantId: string;
}

interface QuickStartState {
  family: QuickStartFamily;
  targetLevel: UserLevel;
  isChecking: boolean;
  verdict: 'plausibel' | 'twijfelachtig' | 'onwaarschijnlijk' | null;
  feedback: string | null;
  error: string | null;
}

function App() {
  const { isAdmin, signInWithGoogle } = useAuth();
  const [view, setView] = useState<View>('start');
  const [appMode, setAppMode] = useState<AppMode>('practice');
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<DeterminationSession | null>(null);
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const [determinationSteps, setDeterminationSteps] = useState<DeterminationStep[]>([]);
  const [sessionLevel, setSessionLevel] = useState<UserLevel>('beginner');
  const [sessionIsSandbox, setSessionIsSandbox] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionHintsUsed, setSessionHintsUsed] = useState(0);
  const [shouldAutoValidateResult, setShouldAutoValidateResult] = useState(false);
  const [continuationState, setContinuationState] = useState<ContinuationState | null>(null);
  const [quickStartState, setQuickStartState] = useState<QuickStartState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentTrainingDeterminationId, setCurrentTrainingDeterminationId] = useState<string | null>(null);
  const [joinCodeFromUrl, setJoinCodeFromUrl] = useState<string | null>(null);
  // Check for join code in URL (from QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setJoinCodeFromUrl(joinCode.toUpperCase());
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auth listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Start handlers
  const handleStartPractice = useCallback((level: UserLevel, isSandbox: boolean) => {
    setAppMode('practice');
    setTrainingSession(null);
    setSessionLevel(level);
    setSessionIsSandbox(isSandbox);
    setContinuationState(null);
    setQuickStartState(null);
    setView('capture');
  }, []);

  const handleStartQuickStart = useCallback((level: UserLevel, family: QuickStartFamily) => {
    setAppMode('practice');
    setTrainingSession(null);
    setSessionLevel(level);
    setSessionIsSandbox(false);
    setContinuationState(null);
    setQuickStartState({
      family,
      targetLevel: level,
      isChecking: false,
      verdict: null,
      feedback: null,
      error: null,
    });
    setView('capture');
  }, []);

  const handleStartTraining = useCallback(async (sessionCode: string, name: string) => {
    // Join the training session in Firestore
    const result = await joinTrainingSession(sessionCode, name);
    if (result) {
      setAppMode('training');
      setTrainingSession({
        code: result.session.code,
        participantName: name,
        participantId: result.participantId,
      });
      setQuickStartState(null);
      setView('capture');
    } else {
      alert('Kon niet deelnemen aan de sessie. Controleer de sessiecode.');
    }
  }, []);

  const handleOpenTrainerDashboard = useCallback(async () => {
    if (user) {
      if (isAdmin) {
        setView('trainer');
      } else {
        alert('Je hebt geen docenttoegang.');
      }
      return;
    }

    if (!auth || !googleProvider) {
      alert('Firebase is niet geconfigureerd. Login is niet beschikbaar.');
      return;
    }

    try {
      await signInWithGoogle();
      const signedInEmail = auth.currentUser?.email ?? '';
      if (signedInEmail && ADMIN_EMAILS.includes(signedInEmail)) {
        setView('trainer');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Kon niet inloggen. Probeer het opnieuw.');
    }
  }, [user, isAdmin, signInWithGoogle]);

  const getCapturedImageBase64 = useCallback(async (data: CapturedData): Promise<string | null> => {
    if (data.thumbnail?.startsWith('data:image/')) {
      return data.thumbnail;
    }

    const firstImageThumbnail = data.images?.[0]?.thumbnail;
    if (firstImageThumbnail?.startsWith('data:image/')) {
      return firstImageThumbnail;
    }

    if (data.blob) {
      return blobToBase64(data.blob);
    }

    return null;
  }, []);

  const startDecisionSession = useCallback(async (
    data: CapturedData,
    options?: {
      continuation?: ContinuationState | null;
      level?: UserLevel;
      quickStart?: QuickStartSessionInfo;
    }
  ) => {
    const sessionId = await createSession({
      type: data.type,
      blob: data.blob,
      thumbnail: data.thumbnail,
      images: data.images,
      videoBlob: data.videoBlob,
      locatie: data.locatie,
    }, {
      level: options?.level ?? sessionLevel,
      isSandbox: sessionIsSandbox,
      quickStart: options?.quickStart,
    });
    setCurrentSessionId(sessionId);
    setCapturedData(data);
    setDeterminationSteps([]);
    setSessionStartTime(Date.now());
    setSessionHintsUsed(0);
    setContinuationState(options?.continuation ?? null);
    if (options?.level) {
      setSessionLevel(options.level);
    }
    setShouldAutoValidateResult(false);
    setView('decision');
  }, [sessionIsSandbox, sessionLevel]);

  // Capture handler
  const handleCapture = useCallback(async (data: CapturedData) => {
    if (quickStartState && appMode === 'practice' && quickStartState.targetLevel !== 'beginner') {
      setCapturedData(data);
      setDeterminationSteps([]);
      setSessionStartTime(null);
      setSessionHintsUsed(0);
      setCurrentSessionId(null);
      setCurrentSession(null);
      setShouldAutoValidateResult(false);
      setContinuationState(null);
      setQuickStartState((prev) => prev ? {
        ...prev,
        isChecking: true,
        verdict: null,
        feedback: null,
        error: null,
      } : prev);
      setView('quickstart-review');

      const definition = getQuickStartDefinition(quickStartState.family);
      const imageBase64 = await getCapturedImageBase64(data);

      if (!definition || !imageBase64) {
        setQuickStartState((prev) => prev ? {
          ...prev,
          isChecking: false,
          error: 'Kon geen bruikbare foto voorbereiden voor de snelle instap.',
        } : prev);
        return;
      }

      const result = await checkQuickStartPlausibility(
        imageBase64,
        definition.label,
        definition.description,
        definition
      );

      setQuickStartState((prev) => prev ? {
        ...prev,
        isChecking: false,
        verdict: result.verdict ?? 'twijfelachtig',
        feedback: result.feedback ?? null,
        error: result.success ? null : (result.error ?? 'Kon de instap niet controleren.'),
      } : prev);
      return;
    }

    await startDecisionSession(data);
  }, [quickStartState, appMode, getCapturedImageBase64, startDecisionSession]);

  // Decision tree handlers
  const handleDecisionStep = useCallback((step: DeterminationStep) => {
    setDeterminationSteps((prev) => [...prev, step]);
    // TODO: In training mode, sync step to Firestore
  }, []);

  const handleDecisionComplete = useCallback(
    async (result: { type: string; description?: string; hintsUsed: number; sourceResultType?: string }) => {
      // Store hints used for result view
      setSessionHintsUsed(result.hintsUsed);
      const effectiveSourceResultType = continuationState?.sourceResultType ?? result.sourceResultType ?? result.type;

      if (currentSessionId) {
        await completeSession(
          currentSessionId,
          {
            type: result.type,
            sourceResultType: effectiveSourceResultType,
            description: result.description || '',
          },
          determinationSteps
        );
        const session = await getSession(currentSessionId);
        if (session) {
          setShouldAutoValidateResult(true);
          setCurrentSession(session);

          // Submit to training session if in training mode
          if (appMode === 'training' && trainingSession) {
            const detId = await submitDetermination(trainingSession.code, trainingSession.participantId, {
              resultType: result.type,
              resultDescription: result.description,
              steps: determinationSteps
                .filter((s) => s.answer === 'ja' || s.answer === 'nee')
                .map((s) => ({
                  questionId: s.questionId,
                  questionText: s.questionText,
                  answer: s.answer as 'ja' | 'nee',
                })),
              hintsUsed: result.hintsUsed,
            });
            setCurrentTrainingDeterminationId(detId);
          } else {
            setCurrentTrainingDeterminationId(null);
          }

          setView('result');
        }
      }
    },
    [currentSessionId, determinationSteps, appMode, trainingSession, continuationState]
  );

  // Navigation handlers
  const handleNewDetermination = useCallback(() => {
    setCurrentSessionId(null);
    setCurrentSession(null);
    setCapturedData(null);
    setDeterminationSteps([]);
    setShouldAutoValidateResult(false);
    setContinuationState(null);
    setQuickStartState(null);
    setView('start');
  }, []);

  const handleSelectSession = useCallback((session: DeterminationSession) => {
    setShouldAutoValidateResult(false);
    setContinuationState(null);
    setQuickStartState(null);
    setCurrentSession(session);
    setView('result');
  }, []);

  const handleBackFromCapture = useCallback(() => {
    setContinuationState(null);
    setQuickStartState(null);
    setView('start');
  }, []);

  const handleBackFromDecision = useCallback(() => {
    setCurrentSessionId(null);
    setCapturedData(null);
    setDeterminationSteps([]);
    setContinuationState(null);
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

    await startDecisionSession(data);
  }, [startDecisionSession]);

  const handleContinueAtLevel = useCallback(async (option: ContinuationOption) => {
    if (!currentSession) return;

    const data: CapturedData = {
      type: currentSession.input.type,
      images: currentSession.input.images,
      blob: currentSession.input.blob,
      thumbnail: currentSession.input.thumbnail,
      videoBlob: currentSession.input.videoBlob,
      locatie: currentSession.input.locatie,
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
    setCurrentSession(null);
    setDeterminationSteps([]);
    setSessionStartTime(Date.now());
    setSessionHintsUsed(0);
    setShouldAutoValidateResult(true);
    setSessionLevel(option.targetLevel);
    setContinuationState({
      treeMode: option.treeMode,
      sourceResultType: option.sourceResultType,
      startQuestionId: option.startQuestionId,
    });
    setView('decision');
  }, [currentSession]);

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

  const handleUseQuickStart = useCallback(async () => {
    if (!capturedData || !quickStartState) return;

    const continuation = getQuickStartContinuation(quickStartState.family, quickStartState.targetLevel);
    const definition = getQuickStartDefinition(quickStartState.family);
    const quickStartMeta: QuickStartSessionInfo = {
      family: quickStartState.family,
      familyLabel: definition?.label ?? quickStartState.family,
      targetLevel: quickStartState.targetLevel,
      verdict: quickStartState.verdict,
      feedback: quickStartState.feedback,
      used: Boolean(continuation),
    };

    if (!continuation) {
      await startDecisionSession(capturedData, {
        level: quickStartState.targetLevel,
        quickStart: quickStartMeta,
      });
      setQuickStartState(null);
      return;
    }

    await startDecisionSession(capturedData, {
      continuation: {
        treeMode: continuation.treeMode,
        sourceResultType: continuation.sourceResultType,
        startQuestionId: continuation.startQuestionId,
      },
      level: continuation.targetLevel,
      quickStart: quickStartMeta,
    });
    setQuickStartState(null);
  }, [capturedData, quickStartState, startDecisionSession]);

  const handleUseFullRoute = useCallback(async () => {
    if (!capturedData || !quickStartState) return;
    const definition = getQuickStartDefinition(quickStartState.family);
    await startDecisionSession(capturedData, {
      level: quickStartState.targetLevel,
      quickStart: {
        family: quickStartState.family,
        familyLabel: definition?.label ?? quickStartState.family,
        targetLevel: quickStartState.targetLevel,
        verdict: quickStartState.verdict,
        feedback: quickStartState.feedback,
        used: false,
      },
    });
    setQuickStartState(null);
  }, [capturedData, quickStartState, startDecisionSession]);

  const handleBackFromQuickStartReview = useCallback(() => {
    setView('capture');
  }, []);

  // Render current view content
  const renderContent = () => {
    const activeTreeMode: DecisionTreeMode =
      continuationState?.treeMode ?? (sessionLevel === 'expert' ? 'expert' : 'beginner');

    if (view === 'start') {
      return (
        <StartScreen
          onStartPractice={handleStartPractice}
          onStartQuickStart={handleStartQuickStart}
          onStartTraining={handleStartTraining}
          onOpenTrainerDashboard={handleOpenTrainerDashboard}
          onViewHistory={() => setView('history')}
          isLoggedIn={!!user}
          version={APP_VERSION}
          initialJoinCode={joinCodeFromUrl}
          onJoinCodeUsed={() => setJoinCodeFromUrl(null)}
        />
      );
    }

    if (view === 'trainer') {
      return <TrainerDashboard onBack={() => setView('start')} />;
    }

    if (view === 'quickstart-review' && capturedData && quickStartState) {
      const definition = getQuickStartDefinition(quickStartState.family);
      return (
        <QuickStartReview
          imageUrl={getImageUrl()}
          familyLabel={definition?.label ?? quickStartState.family}
          targetLevelLabel={quickStartState.targetLevel === 'expert' ? 'Expert' : 'Gevorderd'}
          expectedTraits={definition?.expectedTraits}
          commonConfusions={definition?.commonConfusions}
          exampleOutcomes={definition?.exampleOutcomes}
          isChecking={quickStartState.isChecking}
          verdict={quickStartState.verdict}
          feedback={quickStartState.feedback}
          error={quickStartState.error}
          onUseQuickStart={handleUseQuickStart}
          onUseFullRoute={handleUseFullRoute}
          onBack={handleBackFromQuickStartReview}
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
          level={sessionLevel}
          isSandbox={sessionIsSandbox}
          treeMode={activeTreeMode}
          startQuestionId={continuationState?.startQuestionId}
        />
      );
    }

    if (view === 'result' && currentSession) {
      const continuationOption = currentSession.result
        ? getContinuationOption(currentSession.result.sourceResultType ?? currentSession.result.type, sessionLevel)
        : null;
      const activeContinuation = isContinuationActive(continuationOption) ? continuationOption : null;

      return (
        <ResultView
          session={currentSession}
          onNewDetermination={handleNewDetermination}
          onViewHistory={() => setView('history')}
          onRedeterminate={handleRedeterminate}
          onContinueAtLevel={handleContinueAtLevel}
          continuationOption={activeContinuation}
          trainingInfo={appMode === 'training' && trainingSession && currentTrainingDeterminationId ? {
            sessionCode: trainingSession.code,
            participantId: trainingSession.participantId,
            determinationId: currentTrainingDeterminationId,
          } : undefined}
          level={sessionLevel}
          isSandbox={sessionIsSandbox}
          hintsUsed={sessionHintsUsed}
          startTime={sessionStartTime ?? undefined}
          shouldAutoValidate={shouldAutoValidateResult}
        />
      );
    }

    if (view === 'history') {
      return (
        <HistoryView
          onBack={() => setView('start')}
          onSelectSession={handleSelectSession}
          onResume={handleRedeterminate}
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
                  {appMode === 'training' ? 'TRAINING' : 'DETERMINEREN'}
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
              <SettingsMenu onShowWelcome={() => {}} version={APP_VERSION} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
          <ImageCapture onCapture={handleCapture} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden bg-stone-100">
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

    </div>
  );
}

export default App;
