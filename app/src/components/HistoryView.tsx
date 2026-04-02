import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, Image, List, Map, MapPin, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllSessions, deleteSession, updateSession } from '../lib/db';
import type { DeterminationSession, UserLevel, VondstLocatie } from '../types';
import { formatTypeName } from '../lib/decisionTree';
import { HistoryMap } from './HistoryMap';
import { LocationPickerModal } from './LocationPickerModal';
import { getSourceResultInfo } from '../lib/sourceResultInfo';

type ViewMode = 'list' | 'map';

interface HistoryViewProps {
  onBack: () => void;
  onSelectSession: (session: DeterminationSession) => void;
  onResume?: (session: DeterminationSession) => void;
}

export function HistoryView({ onBack, onSelectSession, onResume }: HistoryViewProps) {
  const [sessions, setSessions] = useState<DeterminationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [locationPickerSession, setLocationPickerSession] = useState<DeterminationSession | null>(null);

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    const sessionsData = await getAllSessions();
    setSessions(sessionsData);
    setLoading(false);
  };

  const handleDelete = async (id: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm('Weet je zeker dat je deze determinatie wilt verwijderen?')) {
      await deleteSession(id);
      loadData();
    }
  };

  const handleSaveLocation = async (location: VondstLocatie | undefined) => {
    if (!location || !locationPickerSession?.id) return;
    await updateSession(locationPickerSession.id, {
      input: { ...locationPickerSession.input, locatie: location },
    });
    setLocationPickerSession(null);
    loadData();
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

  const formatLevelLabel = (level: UserLevel) =>
    level === 'expert' ? 'Expert' : level === 'gevorderd' ? 'Gevorderd' : 'Beginner';

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header - alleen op mobiel */}
      <div className="lg:hidden bg-stone-800 dark:bg-stone-900 p-4 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-lg font-semibold">Mijn vondsten</h1>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block p-6 pb-0 shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Mijn vondsten</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bekijk en beheer je opgeslagen determinaties</p>
      </div>

      {/* Toggle en zoekbalk */}
      {sessions.length > 0 && (
        <div className="px-4 pt-3 shrink-0 space-y-3">
          {/* View toggle */}
          <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-stone-700 shadow-sm'
                  : 'hover:bg-white/50 dark:hover:bg-stone-600/50'
              }`}
              style={{ color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <List className="w-4 h-4" />
              Lijst
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-stone-700 shadow-sm'
                  : 'hover:bg-white/50 dark:hover:bg-stone-600/50'
              }`}
              style={{ color: viewMode === 'map' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Map className="w-4 h-4" />
              Kaart
            </button>
          </div>

          {/* Zoekbalk - alleen in lijst view */}
          {viewMode === 'list' && (
            <>
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
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filteredSessions.length} van {sessions.length} determinaties
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
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
        ) : viewMode === 'map' ? (
          /* Kaart view */
          <div className="h-full p-4">
            <HistoryMap
              sessions={sessions.filter(s => s.status === 'completed' && s.input.locatie)}
              locations={[]}
              onSelectSession={onSelectSession}
              onSelectLocation={() => {}}
              onAddLocation={() => {}}
            />
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
          /* Lijst view */
          <div className="h-full overflow-y-auto p-4 lg:px-6 space-y-3">
            {filteredSessions.map((session, index) => {
              const isCompleted = session.status === 'completed' && session.result;
              const resultType = session.result?.type;
              const sourceInfo = isCompleted
                ? getSourceResultInfo(session.result?.sourceResultType ?? resultType)
                : null;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => {
                    if (isCompleted) onSelectSession(session);
                    else if (onResume) onResume(session);
                  }}
                  className={`card flex items-center gap-3 transition-all duration-200 ${
                    isCompleted || onResume
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
                    {isCompleted && sourceInfo && (
                      <p
                        className="text-xs line-clamp-2 mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {sourceInfo.summary}
                      </p>
                    )}
                    {isCompleted && session.quickStart && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          Snelle instap: {session.quickStart.familyLabel}
                        </span>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                          {formatLevelLabel(session.quickStart.targetLevel)}
                        </span>
                        {!session.quickStart.used && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Volledige route
                          </span>
                        )}
                      </div>
                    )}
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
                    {!isCompleted && onResume && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onResume(session); }}
                        className="p-2 hover:text-amber-600 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Hervatten"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {isCompleted && !session.input.locatie && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setLocationPickerSession(session); }}
                        className="p-2 hover:text-amber-600 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Voeg toe aan kaart"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Footer met terug knop - alleen op mobiel */}
      <div className="lg:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={onBack} className="btn-primary w-full py-3">
          Terug
        </button>
      </div>

      {/* Location Picker Modal */}
      {locationPickerSession && (
        <LocationPickerModal
          onClose={() => setLocationPickerSession(null)}
          onSave={handleSaveLocation}
        />
      )}
    </div>
  );
}
