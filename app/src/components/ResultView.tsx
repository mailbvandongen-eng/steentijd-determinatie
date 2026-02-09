import type { DeterminationSession } from '../types';
import { formatTypeName } from '../lib/decisionTree';

interface ResultViewProps {
  session: DeterminationSession;
  onNewDetermination: () => void;
  onViewHistory: () => void;
}

export function ResultView({ session, onNewDetermination, onViewHistory }: ResultViewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-6 text-center">
        <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h1 className="text-2xl font-bold">Determinatie Compleet</h1>
      </div>

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

      {/* Thumbnail */}
      {session.input.thumbnail && (
        <div className="px-4 pb-4">
          <div className="card">
            <h3 className="text-sm text-stone-500 mb-2">Jouw artefact</h3>
            <img
              src={session.input.thumbnail}
              alt="Artefact"
              className="w-full max-w-xs mx-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Doorlopen pad */}
      <div className="px-4 pb-4 flex-1">
        <div className="card">
          <h3 className="text-sm text-stone-500 mb-3">Doorlopen stappen ({session.steps.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
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

      {/* Acties */}
      <div className="p-4 bg-white border-t border-stone-200 flex gap-4">
        <button onClick={onViewHistory} className="btn-secondary flex-1">
          Geschiedenis
        </button>
        <button onClick={onNewDetermination} className="btn-primary flex-1">
          Nieuwe determinatie
        </button>
      </div>
    </div>
  );
}
