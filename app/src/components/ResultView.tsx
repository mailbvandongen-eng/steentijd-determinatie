import { useState } from 'react';
import type { DeterminationSession } from '../types';
import { formatTypeName } from '../lib/decisionTree';

interface ResultViewProps {
  session: DeterminationSession;
  onNewDetermination: () => void;
  onViewHistory: () => void;
  onRedeterminate?: (session: DeterminationSession) => void;
}

export function ResultView({ session, onNewDetermination, onViewHistory, onRedeterminate }: ResultViewProps) {
  const [showAllImages, setShowAllImages] = useState(false);

  // Verzamel alle beschikbare afbeeldingen
  const allImages = session.input.images || [];
  const hasMultipleImages = allImages.length > 1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - subtiele amber badge */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-amber-700">Determinatie voltooid</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Resultaat */}
        <div className="p-4">
          <div className="card">
            <h2 className="text-sm text-stone-500 uppercase tracking-wide">Resultaat</h2>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {session.result ? formatTypeName(session.result.type) : 'Onbekend'}
            </p>
            {session.result?.description && (
              <p className="text-stone-600 mt-2">{session.result.description}</p>
            )}
          </div>
        </div>

        {/* Thumbnail en beeldmateriaal */}
        {session.input.thumbnail && (
          <div className="px-4 pb-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-stone-500">Jouw artefact</h3>
                {hasMultipleImages && (
                  <button
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {showAllImages ? 'Verberg' : 'Toon alle foto\'s'}
                    <svg
                      className={`w-4 h-4 transition-transform ${showAllImages ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Hoofdafbeelding of grid van alle afbeeldingen */}
              {showAllImages && hasMultipleImages ? (
                <div className="grid grid-cols-2 gap-2">
                  {allImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.thumbnail}
                        alt={`Foto ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                        {img.label === 'dorsaal' ? 'Foto 1' :
                         img.label === 'ventraal' ? 'Foto 2' :
                         img.label === 'zijkant' ? 'Foto 3' : 'Foto 4'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <img
                  src={session.input.thumbnail}
                  alt="Artefact"
                  className="w-full max-w-xs mx-auto rounded-lg"
                />
              )}

              {hasMultipleImages && !showAllImages && (
                <p className="text-xs text-stone-400 text-center mt-2">
                  {allImages.length} foto's beschikbaar
                </p>
              )}
            </div>
          </div>
        )}

        {/* Doorlopen pad */}
        <div className="px-4 pb-4">
          <div className="card">
            <h3 className="text-sm text-stone-500 mb-3">Doorlopen stappen ({session.steps.length})</h3>
            <div className="space-y-2">
              {session.steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded ${
                    step.answer === 'ja' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      step.answer === 'ja'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {step.answer.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-500">Vraag {step.questionId}</p>
                    <p className="text-sm text-stone-700 truncate">{step.questionText}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acties */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 shrink-0 space-y-2">
        {/* Opnieuw determineren - alleen als er foto's zijn en callback beschikbaar is */}
        {onRedeterminate && (session.input.images?.length || session.input.thumbnail) && (
          <button
            onClick={() => onRedeterminate(session)}
            className="w-full py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Opnieuw determineren met deze foto's
          </button>
        )}
        <div className="flex gap-3">
          <button onClick={onViewHistory} className="btn-secondary flex-1">
            Geschiedenis
          </button>
          <button onClick={onNewDetermination} className="btn-primary flex-1">
            Nieuwe determinatie
          </button>
        </div>
      </div>
    </div>
  );
}
