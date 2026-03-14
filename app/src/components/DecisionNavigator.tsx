import { useState, useEffect } from 'react';
import { getQuestion, processAnswer, getImagesForQuestion, formatTypeName } from '../lib/decisionTree';
import { getHintForQuestion } from '../lib/aiAnalysis';
import type { DeterminationStep } from '../types';

const MAX_HINTS = 3;

interface DecisionNavigatorProps {
  imageUrl: string;
  onStep: (step: DeterminationStep) => void;
  onComplete: (result: { type: string; description?: string }) => void;
  onBack: () => void;
}

export function DecisionNavigator({ imageUrl, onStep, onComplete, onBack }: DecisionNavigatorProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState('1');
  const [history, setHistory] = useState<string[]>([]);
  const [stepCount, setStepCount] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const question = getQuestion(currentQuestionId);
  const images = getImagesForQuestion(currentQuestionId);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Clear hint when question changes
    setCurrentHint(null);
    setHintError(null);
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

    if (result.isEnd && result.result) {
      onComplete({
        type: result.result,
        description: formatTypeName(result.result),
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
      setHistory((h) => h.slice(0, -1));
      setCurrentQuestionId(prev);
      setStepCount((c) => c - 1);
    } else {
      onBack();
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

  const canUseHint = hintsUsed < MAX_HINTS && !isLoadingHint;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
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
        {/* Hint counter */}
        <div className="flex items-center gap-1 text-amber-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-medium">{MAX_HINTS - hintsUsed}</span>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Vraag */}
        <div className="card mb-3">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">
            {question.vraag}
          </h2>
          {question.toelichting && (
            <p className="text-sm text-stone-600 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
              {question.toelichting}
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

        {/* Referentie afbeeldingen */}
        {images.length > 0 && (
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
        {/* Hint button */}
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

        <p className="text-xs text-stone-500 text-center mb-2">
          Bekijk je artefact en beantwoord de vraag
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
      </div>
    </div>
  );
}
