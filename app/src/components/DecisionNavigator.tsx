import { useState, useEffect } from 'react';
import { getQuestion, processAnswer, getImagesForQuestion, formatTypeName } from '../lib/decisionTree';
import type { DeterminationStep } from '../types';

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

  const question = getQuestion(currentQuestionId);
  const images = getImagesForQuestion(currentQuestionId);

  useEffect(() => {
    window.scrollTo(0, 0);
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
              💡 {question.toelichting}
            </p>
          )}
        </div>

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
        <p className="text-xs text-stone-500 text-center mb-2">
          Bekijk je artefact en beantwoord de vraag
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer('ja')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            ✓ Ja
          </button>
          <button
            onClick={() => handleAnswer('nee')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            ✗ Nee
          </button>
        </div>
      </div>
    </div>
  );
}
