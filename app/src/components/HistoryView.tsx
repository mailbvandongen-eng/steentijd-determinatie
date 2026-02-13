import { useEffect, useState } from 'react';
import { getAllSessions, deleteSession } from '../lib/db';
import type { DeterminationSession } from '../types';
import { formatTypeName } from '../lib/decisionTree';

interface HistoryViewProps {
  onBack: () => void;
  onSelectSession: (session: DeterminationSession) => void;
}

export function HistoryView({ onBack, onSelectSession }: HistoryViewProps) {
  const [sessions, setSessions] = useState<DeterminationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const data = await getAllSessions();
    setSessions(data);
    setLoading(false);
  };

  const handleDelete = async (id: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm('Weet je zeker dat je deze determinatie wilt verwijderen?')) {
      await deleteSession(id);
      loadSessions();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-stone-800 p-4 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-lg font-semibold">Geschiedenis</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-stone-500">Laden...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-stone-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-stone-500">Nog geen determinaties</p>
            <button onClick={onBack} className="btn-primary mt-4">
              Start eerste determinatie
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isCompleted = session.status === 'completed' && session.result;
              const resultType = session.result?.type;

              return (
                <div
                  key={session.id}
                  onClick={() => isCompleted ? onSelectSession(session) : undefined}
                  className={`card flex items-center gap-3 transition-shadow ${
                    isCompleted
                      ? 'cursor-pointer hover:shadow-lg'
                      : 'opacity-60'
                  }`}
                >
                  {session.input.thumbnail ? (
                    <img
                      src={session.input.thumbnail}
                      alt="Artefact"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-stone-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isCompleted ? 'text-stone-900' : 'text-stone-500'}`}>
                        {isCompleted ? formatTypeName(resultType || '') : 'Afgebroken'}
                      </p>
                      {isCompleted && (
                        <span className="shrink-0 w-2 h-2 bg-green-500 rounded-full" title="Voltooid" />
                      )}
                    </div>
                    <p className="text-sm text-stone-500">{formatDate(session.createdAt)}</p>
                    {isCompleted && session.result?.confidence && (
                      <p className={`text-xs ${
                        session.result.confidence === 'hoog' ? 'text-green-600' :
                        session.result.confidence === 'laag' ? 'text-orange-600' : 'text-stone-400'
                      }`}>
                        {session.result.confidence} vertrouwen
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-2 text-stone-400 hover:text-red-500"
                      title="Verwijderen"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    {isCompleted && (
                      <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer met terug naar start */}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 shrink-0">
        <button onClick={onBack} className="btn-primary w-full py-3">
          Nieuwe determinatie
        </button>
      </div>
    </div>
  );
}
