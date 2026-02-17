import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, Image } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  // Filter sessies op basis van zoekterm
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter(session => {
      if (!session.result) return false;
      const type = formatTypeName(session.result.type || '').toLowerCase();
      const period = (session.result.period || '').toLowerCase();
      const description = (session.result.description || '').toLowerCase();
      const characteristics = (session.result.characteristics || []).join(' ').toLowerCase();

      return type.includes(query) ||
             period.includes(query) ||
             description.includes(query) ||
             characteristics.includes(query);
    });
  }, [sessions, searchQuery]);

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
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-lg font-semibold">Geschiedenis</h1>
      </div>

      {/* Zoekbalk */}
      {sessions.length > 0 && (
        <div className="px-4 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op type, periode..."
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-stone-500 mt-1">
              {filteredSessions.length} van {sessions.length} determinaties
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-stone-500">Laden...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500">Nog geen determinaties</p>
            <button onClick={onBack} className="btn-primary mt-4">
              Start eerste determinatie
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500">Geen resultaten voor "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-600 text-sm mt-2 hover:underline"
            >
              Wis zoekopdracht
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
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
                      <Image className="w-8 h-8 text-stone-400" />
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
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isCompleted && (
                      <ChevronRight className="w-5 h-5 text-stone-300" />
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
