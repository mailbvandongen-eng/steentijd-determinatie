import { useState, useEffect } from 'react';
import { Sprout, Leaf, Star } from 'lucide-react';
import { getQuestion, processAnswer, getImagesForQuestion, formatTypeName, resultMinLevels } from '../lib/decisionTree';
import { getHintForQuestion } from '../lib/aiAnalysis';
import type { DeterminationStep, UserLevel } from '../types';

const MAX_HINTS = 3;

interface DecisionNavigatorProps {
  imageUrl: string;
  onStep: (step: DeterminationStep) => void;
  onComplete: (result: { type: string; description?: string; hintsUsed: number }) => void;
  onBack: () => void;
  level?: UserLevel;
  isSandbox?: boolean;
}

export function DecisionNavigator({ imageUrl, onStep, onComplete, onBack, level = 'beginner', isSandbox = false }: DecisionNavigatorProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState('1');
  const [history, setHistory] = useState<string[]>([]);
  const [forwardHistory, setForwardHistory] = useState<string[]>([]);
  const [stepCount, setStepCount] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  // Gevorderd mode: toon toelichting pas na antwoord
  const [showToelichtingAfterAnswer, setShowToelichtingAfterAnswer] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<'ja' | 'nee' | null>(null);

  const question = getQuestion(currentQuestionId);
  const images = getImagesForQuestion(currentQuestionId);

  // In gevorderd mode zijn hints niet beschikbaar
  const hintsEnabled = level === 'beginner';
  // In gevorderd mode: toelichting pas na antwoord
  const showToelichtingDirectly = level === 'beginner';

  useEffect(() => {
    window.scrollTo(0, 0);
    // Clear hint when question changes
    setCurrentHint(null);
    setHintError(null);
    setShowToelichtingAfterAnswer(false);
    setLastAnswer(null);
  }, [currentQuestionId]);

  const handleAnswer = (answer: 'ja' | 'nee') => {
    if (!question) return;

    // Log de stap
    const step: DeterminationStep = {
      questionId: currentQuestionId,
      questionText: question.vraag,
      answer,
      referenceImages: images.map((img) => img.file),
      timestamp: new Date().toISOString(),
    };
    onStep(step);

    // Verwerk het antwoord
    const result = processAnswer(currentQuestionId, answer);

    // Clear forward history when user makes a new answer choice
    setForwardHistory([]);

    const levelOrder: Record<string, number> = { beginner: 0, gevorderd: 1, expert: 2 };

    const proceedToNext = () => {
      if (result.isEnd && result.result) {
        // Dieptebegrenzing: check of dit resultaat bereikbaar is op het huidige niveau
        const resultLevel = resultMinLevels[result.result];
        if (resultLevel && levelOrder[resultLevel] > levelOrder[level]) {
          // Resultaat vereist hoger niveau
          const vereistNiveau = resultLevel === 'expert' ? 'Expert' : 'Gevorderd';
          onComplete({
            type: 'onbepaald-beginnersniveau',
            description: `Dit artefact is verder te determineren op niveau ${vereistNiveau}`,
            hintsUsed,
          });
        } else {
          onComplete({
            type: result.result,
            description: formatTypeName(result.result),
            hintsUsed,
          });
        }
      } else if (result.nextQuestion) {
        setHistory((prev) => [...prev, currentQuestionId]);
        setCurrentQuestionId(result.nextQuestion);
        setStepCount((c) => c + 1);
      }
    };

    // In gevorderd mode (niet expert): toon toelichting na antwoord (als er toelichting is)
    if (level === 'gevorderd' && question.toelichting) {
      setLastAnswer(answer);
      setShowToelichtingAfterAnswer(true);
      // Auto-proceed after 2 seconds, or user can click "Verder"
    } else {
      proceedToNext();
    }
  };

  const handleContinueAfterFeedback = () => {
    if (!question) return;
    const result = processAnswer(currentQuestionId, lastAnswer!);

    if (result.isEnd && result.result) {
      onComplete({
        type: result.result,
        description: formatTypeName(result.result),
        hintsUsed,
      });
    } else if (result.nextQuestion) {
      setHistory((prev) => [...prev, currentQuestionId]);
      setCurrentQuestionId(result.nextQuestion);
      setStepCount((c) => c + 1);
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setForwardHistory((f) => [currentQuestionId, ...f]);
      setHistory((h) => h.slice(0, -1));
      setCurrentQuestionId(prev);
      setStepCount((c) => c - 1);
    } else {
      onBack();
    }
  };

  const handleGoForward = () => {
    if (forwardHistory.length > 0) {
      const next = forwardHistory[0];
      setHistory((h) => [...h, currentQuestionId]);
      setForwardHistory((f) => f.slice(1));
      setCurrentQuestionId(next);
      setStepCount((c) => c + 1);
    }
  };

  const handleRequestHint = async () => {
    if (hintsUsed >= MAX_HINTS || isLoadingHint || !question) return;

    setIsLoadingHint(true);
    setHintError(null);
    setCurrentHint(null);

    try {
      const result = await getHintForQuestion(
        imageUrl,
        question.vraag,
        currentQuestionId,
        question.toelichting
      );

      if (result.success && result.hint) {
        setCurrentHint(result.hint);
        setHintsUsed((prev) => prev + 1);
      } else {
        setHintError(result.error || 'Kon geen hint ophalen.');
      }
    } catch {
      setHintError('Er ging iets mis bij het ophalen van de hint.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  if (!question) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Vraag niet gevonden</p>
        <button onClick={handleGoBack} className="btn-secondary mt-4">
          Terug
        </button>
      </div>
    );
  }

  const canUseHint = hintsEnabled && hintsUsed < MAX_HINTS && !isLoadingHint;

  const levelConfig = {
    beginner: { icon: <Sprout className="w-4 h-4" />, label: 'Beginner', color: 'bg-green-500/20 text-green-400' },
    gevorderd: { icon: <Leaf className="w-4 h-4" />, label: 'Gevorderd', color: 'bg-amber-500/20 text-amber-400' },
    expert: { icon: <Star className="w-4 h-4" />, label: 'Expert', color: 'bg-purple-500/20 text-purple-400' },
  };
  const currentLevelConfig = levelConfig[level];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <div className="bg-stone-800 p-3 flex items-center gap-3 shrink-0">
        <button onClick={handleGoBack} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src={imageUrl} alt="Artefact" className="w-10 h-10 rounded object-cover" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Stap {stepCount}</p>
          <p className="text-stone-400 text-xs">{history.length > 0 ? 'Terug = vorige vraag' : 'Terug = annuleren'}</p>
        </div>
        {/* Level badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentLevelConfig.color}`}>
          {currentLevelConfig.icon}
          {isSandbox && <span className="opacity-70">Vrij</span>}
        </div>
        {/* Hint counter - only show in beginner mode */}
        {hintsEnabled && (
          <div className="flex items-center gap-1 text-amber-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">{MAX_HINTS - hintsUsed}</span>
          </div>
        )}
      </div>

      {/* Gevorderd mode: Feedback modal after answer */}
      {showToelichtingAfterAnswer && question.toelichting && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                lastAnswer === 'ja' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {lastAnswer === 'ja' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-stone-900">
                  Je antwoord: {lastAnswer === 'ja' ? 'Ja' : 'Nee'}
                </p>
                <p className="text-sm text-stone-500">Bekijk de toelichting</p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
              <p className="text-sm text-stone-700">{question.toelichting}</p>
            </div>

            <button
              onClick={handleContinueAfterFeedback}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Verder
            </button>
          </div>
        </div>
      )}

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Vraag */}
        <div className="card mb-3">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">
            {question.vraag}
          </h2>
          {/* Toelichting: in beginner direct, in gevorderd pas na antwoord */}
          {question.toelichting && showToelichtingDirectly && (
            <p className="text-sm text-stone-600 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
              {question.toelichting}
            </p>
          )}
          {/* In gevorderd mode: hint dat er toelichting komt na antwoord */}
          {question.toelichting && !showToelichtingDirectly && !showToelichtingAfterAnswer && (
            <p className="text-xs text-stone-400 italic mt-2">
              Toelichting beschikbaar na je antwoord
            </p>
          )}
        </div>

        {/* AI Hint */}
        {(currentHint || isLoadingHint || hintError) && (
          <div className="card mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 mb-1">AI HINT</p>
                {isLoadingHint && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Hint wordt opgehaald...</span>
                  </div>
                )}
                {hintError && (
                  <p className="text-sm text-red-600">{hintError}</p>
                )}
                {currentHint && (
                  <p className="text-sm text-blue-900">{currentHint}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jouw artefact */}
        <div className="card mb-3">
          <p className="text-xs text-stone-500 mb-2 font-medium">JOUW ARTEFACT</p>
          <img
            src={imageUrl}
            alt="Jouw artefact"
            className="w-full max-h-48 object-contain rounded border border-stone-200"
          />
        </div>

        {/* Referentie afbeeldingen — alleen in beginner mode */}
        {images.length > 0 && level === 'beginner' && (
          <div className="card">
            <p className="text-xs text-stone-500 mb-2 font-medium">REFERENTIE VOORBEELDEN</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.slice(0, 4).map((img) => (
                <img
                  key={img.file}
                  src={`./images_algoritme/${img.file}`}
                  alt="Referentie"
                  className="h-20 w-auto rounded border border-stone-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Antwoord knoppen - fixed */}
      <div className="p-3 bg-white border-t border-stone-200 shrink-0">
        {/* Hint button - only in beginner mode */}
        {hintsEnabled && (
          <div className="flex justify-center mb-2">
            <button
              onClick={handleRequestHint}
              disabled={!canUseHint}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                canUseHint
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {hintsUsed >= MAX_HINTS
                ? 'Geen hints meer'
                : `Vraag AI hint (${MAX_HINTS - hintsUsed} over)`}
            </button>
          </div>
        )}

        <p className="text-xs text-stone-500 text-center mb-2">
          {level === 'beginner'
            ? 'Bekijk je artefact en beantwoord de vraag'
            : level === 'gevorderd'
            ? 'Zelfstandig determineren - geen hints beschikbaar'
            : 'Expert modus - volledig zelfstandig determineren'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer('ja')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            Ja
          </button>
          <button
            onClick={() => handleAnswer('nee')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            Nee
          </button>
        </div>
        {/* Back / Forward navigation */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleGoBack}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {history.length > 0 ? 'Vorige stap' : 'Annuleren'}
          </button>
          {forwardHistory.length > 0 && (
            <button
              onClick={handleGoForward}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Volgende stap
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
