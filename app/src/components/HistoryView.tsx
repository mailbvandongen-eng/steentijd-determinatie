import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, Image, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllSessions, deleteSession } from '../lib/db';
import type { DeterminationSession } from '../types';
import { formatTypeName } from '../lib/decisionTree';
import { HistoryMap } from './HistoryMap';

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

  // Bereken statistieken
  const stats = useMemo(() => {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.result);

    // Tel unieke types
    const typeCounts: Record<string, number> = {};
    completedSessions.forEach(s => {
      const type = s.result?.type || 'Onbekend';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Meest voorkomende type
    let mostCommonType = '-';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = formatTypeName(type);
      }
    });

    return {
      total: completedSessions.length,
      uniqueTypes: Object.keys(typeCounts).length,
      mostCommonType,
    };
  }, [sessions]);

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
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header - alleen op mobiel */}
      <div className="lg:hidden bg-stone-800 dark:bg-stone-900 p-4 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-lg font-semibold">Geschiedenis</h1>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block p-6 pb-0 shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Geschiedenis</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bekijk en beheer je opgeslagen determinaties</p>
      </div>

      {/* Statistieken */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-3 shrink-0"
        >
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="card p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Determinaties</p>
            </div>
            <div className="card p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Award className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.uniqueTypes}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Unieke types</p>
            </div>
            <div className="card p-3 text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Image className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{stats.mostCommonType}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Meest gevonden</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kaart met vondsten */}
      {sessions.length > 0 && (
        <div className="px-4 pt-2 shrink-0">
          <HistoryMap sessions={sessions} onSelectSession={onSelectSession} />
        </div>
      )}

      {/* Zoekbalk */}
      {sessions.length > 0 && (
        <div className="px-4 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op type, periode..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
          {searchQuery && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {filteredSessions.length} van {sessions.length} determinaties
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 lg:px-6 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-secondary)' }}>Laden...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nog geen determinaties</p>
            <button onClick={onBack} className="btn-primary mt-4">
              Start eerste determinatie
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Geen resultaten voor "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-600 dark:text-amber-400 text-sm mt-2 hover:underline"
            >
              Wis zoekopdracht
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session, index) => {
              const isCompleted = session.status === 'completed' && session.result;
              const resultType = session.result?.type;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => isCompleted ? onSelectSession(session) : undefined}
                  className={`card flex items-center gap-3 transition-all duration-200 ${
                    isCompleted
                      ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                      : 'opacity-60'
                  }`}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {session.input.thumbnail ? (
                    <img
                      src={session.input.thumbnail}
                      alt="Artefact"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Image className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate" style={{ color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {isCompleted ? formatTypeName(resultType || '') : 'Afgebroken'}
                      </p>
                      {isCompleted && (
                        <span className="shrink-0 w-2 h-2 bg-green-500 rounded-full" title="Voltooid" />
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(session.createdAt)}</p>
                    {isCompleted && session.result?.confidence && (
                      <p className={`text-xs ${
                        session.result.confidence === 'hoog' ? 'text-green-600 dark:text-green-400' :
                        session.result.confidence === 'laag' ? 'text-orange-600 dark:text-orange-400' : ''
                      }`} style={{ color: session.result.confidence === 'gemiddeld' ? 'var(--text-muted)' : undefined }}>
                        {session.result.confidence} vertrouwen
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-2 hover:text-red-500 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Verwijderen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isCompleted && (
                      <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer met terug naar start - alleen op mobiel */}
      <div className="lg:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={onBack} className="btn-primary w-full py-3">
          Nieuwe determinatie
        </button>
      </div>
    </div>
  );
}
