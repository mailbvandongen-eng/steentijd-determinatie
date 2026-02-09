import { useState, useEffect } from 'react';
import { decisionTree, getImagesForQuestion, parseAnswer, formatTypeName } from '../lib/decisionTree';
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

  const question = decisionTree[currentQuestionId];
  const images = getImagesForQuestion(currentQuestionId);

  useEffect(() => {
    // Scroll naar boven bij nieuwe vraag
    window.scrollTo(0, 0);
  }, [currentQuestionId]);

  const handleAnswer = (answer: 'ja' | 'nee') => {
    const answerValue = answer === 'ja' ? question?.ja : question?.nee;
    const parsed = parseAnswer(answerValue);

    // Log de stap
    const step: DeterminationStep = {
      questionId: currentQuestionId,
      questionText: question?.vraag || '',
      answer,
      referenceImages: images.map((img) => img.file),
      timestamp: new Date().toISOString(),
    };
    onStep(step);

    if (parsed.isEnd && parsed.value) {
      // Eindresultaat bereikt
      onComplete({
        type: parsed.value,
        description: formatTypeName(parsed.value),
      });
    } else if (parsed.value) {
      // Ga naar volgende vraag
      setHistory((prev) => [...prev, currentQuestionId]);
      setCurrentQuestionId(parsed.value);
    } else {
      // Geen duidelijke volgende stap, toon als twijfel
      alert('Geen duidelijke volgende stap. Probeer een andere antwoord of ga terug.');
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentQuestionId(prev);
    } else {
      onBack();
    }
  };

  if (!question) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Vraag niet gevonden: {currentQuestionId}</p>
        <button onClick={handleGoBack} className="btn-secondary mt-4">
          Terug
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header met artefact thumbnail */}
      <div className="bg-stone-800 p-3 flex items-center gap-3">
        <img src={imageUrl} alt="Artefact" className="w-12 h-12 rounded-lg object-cover" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Determinatie</p>
          <p className="text-stone-400 text-xs">Vraag {currentQuestionId}</p>
        </div>
        <button onClick={handleGoBack} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Vraag */}
      <div className="p-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Vraag {currentQuestionId}</h2>
          <p className="text-stone-700">{question.vraag || 'Geen vraagtekst beschikbaar'}</p>
        </div>
      </div>

      {/* Referentie afbeeldingen */}
      {images.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-stone-500 mb-2">Referentie afbeeldingen:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img) => (
              <img
                key={img.file}
                src={`/images_algoritme/${img.file}`}
                alt={`Referentie ${img.file}`}
                className="h-24 w-auto rounded-lg border border-stone-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vergelijk met je artefact */}
      <div className="px-4 pb-4">
        <p className="text-sm text-stone-500 mb-2">Jouw artefact:</p>
        <img src={imageUrl} alt="Jouw artefact" className="h-32 w-auto rounded-lg border border-stone-200" />
      </div>

      {/* Antwoord knoppen */}
      <div className="mt-auto p-4 bg-white border-t border-stone-200">
        <div className="flex gap-4">
          <button onClick={() => handleAnswer('ja')} className="btn-success flex-1 py-4 text-lg">
            Ja
          </button>
          <button onClick={() => handleAnswer('nee')} className="btn-danger flex-1 py-4 text-lg">
            Nee
          </button>
        </div>
        {question.ja && (
          <p className="text-xs text-stone-500 mt-2 text-center">
            Ja → {formatTypeName(question.ja).substring(0, 40)}...
          </p>
        )}
      </div>
    </div>
  );
}
