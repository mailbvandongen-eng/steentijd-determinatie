import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LogOut,
  Eye,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  createTrainingSession,
  getDocentSessions,
  getSessionParticipants,
  subscribeToParticipants,
  closeTrainingSession,
  deleteTrainingSession,
  validateDeterminationAsDocent,
} from '../lib/trainingSession';
import type {
  TrainingSession,
  Participant,
  ParticipantDetermination,
} from '../lib/trainingSession';
import { formatTypeName } from '../lib/decisionTree';

interface TrainerDashboardProps {
  onBack: () => void;
}

export default function TrainerDashboard({ onBack }: TrainerDashboardProps) {
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load docent's sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Subscribe to participants for active sessions, one-time fetch for closed sessions
  useEffect(() => {
    if (!selectedSession) {
      setParticipants([]);
      return;
    }

    if (selectedSession.status === 'active') {
      const unsubscribe = subscribeToParticipants(selectedSession.code, (newParticipants) => {
        setParticipants(newParticipants);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      getSessionParticipants(selectedSession.code).then(setParticipants);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    setIsLoading(true);
    const loadedSessions = await getDocentSessions();
    setSessions(loadedSessions);

    // Auto-select active session if exists
    const active = loadedSessions.find(s => s.status === 'active');
    if (active) {
      setActiveSession(active);
      setSelectedSession(active);
    }

    setIsLoading(false);
  };

  const handleCreateSession = async () => {
    if (!auth?.currentUser) {
      setCreateError('Je moet ingelogd zijn om een sessie te maken');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    const session = await createTrainingSession(newSessionTitle || undefined);
    if (session) {
      setSessions([session, ...sessions]);
      setActiveSession(session);
      setSelectedSession(session);
      setShowCreateModal(false);
      setNewSessionTitle('');
    } else {
      setCreateError('Sessie aanmaken mislukt. Controleer je internetverbinding of Firestore-rechten.');
    }
    setIsCreating(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const handleViewClosedSession = async (session: TrainingSession) => {
    setSelectedSession(session);
    setExpandedParticipant(null);
  };

  const handleCloseSession = async (session: TrainingSession) => {
    if (!confirm(`Weet je zeker dat je sessie "${session.code}" wilt sluiten?`)) return;

    const success = await closeTrainingSession(session.code);
    if (success) {
      const closed = { ...session, status: 'closed' as const };
      setSessions(sessions.map(s => s.id === session.id ? closed : s));
      if (activeSession?.id === session.id) {
        setActiveSession(null);
      }
      if (selectedSession?.id === session.id) {
        setSelectedSession(closed);
      }
    }
  };

  const handleDeleteSession = async (session: TrainingSession) => {
    if (!confirm(`Weet je zeker dat je sessie "${session.code}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;

    const success = await deleteTrainingSession(session.code);
    if (success) {
      setSessions(sessions.filter(s => s.id !== session.id));
      if (activeSession?.id === session.id) {
        setActiveSession(null);
      }
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
      }
    }
  };

  const handleValidate = async (
    participantId: string,
    determinationId: string,
    approved: boolean
  ) => {
    if (!selectedSession) return;

    const success = await validateDeterminationAsDocent(
      selectedSession.code,
      participantId,
      determinationId,
      approved
    );

    // For closed sessions, refresh participants locally after validation
    if (success && selectedSession.status === 'closed') {
      setParticipants(prev => prev.map(p => {
        if (p.id !== participantId) return p;
        return {
          ...p,
          determinations: p.determinations.map(d => {
            if (d.id !== determinationId) return d;
            return { ...d, docentValidation: { approved, validatedAt: new Date() } };
          }),
        };
      }));
    }
  };

  const copySessionCode = () => {
    if (activeSession) {
      navigator.clipboard.writeText(activeSession.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getJoinUrl = () => {
    if (!activeSession) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?join=${activeSession.code}`;
  };

  const totalDeterminations = participants.reduce(
    (sum, p) => sum + p.determinations.length,
    0
  );

  const pendingValidations = participants.reduce(
    (sum, p) => sum + p.determinations.filter(d => !d.docentValidation).length,
    0
  );

  if (isLoading) {
    return (
      <div className="h-full bg-stone-100 dark:bg-stone-900 overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 to-amber-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Docent Dashboard</h1>
            <p className="text-amber-100 text-sm">
              {auth?.currentUser?.email}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nieuwe sessie
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl font-medium transition-colors text-sm"
            title="Uitloggen"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </button>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">

        {/* Active Session QR Code */}
        {activeSession && activeSession.status === 'active' && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={getJoinUrl()}
                  size={180}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                  {activeSession.title}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                  <span className="text-3xl font-mono font-bold text-amber-600">
                    {activeSession.code}
                  </span>
                  <button
                    onClick={copySessionCode}
                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                    title="Kopieer code"
                  >
                    {copiedCode ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-stone-500" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm">
                  <div className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                    <Users className="w-4 h-4" />
                    {participants.length} deelnemers
                  </div>
                  <div className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                    <CheckCircle className="w-4 h-4" />
                    {totalDeterminations} determinaties
                  </div>
                  {pendingValidations > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-4 h-4" />
                      {pendingValidations} te valideren
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleCloseSession(activeSession)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Sessie sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        {selectedSession && (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                  Deelnemers & Determinaties
                </h3>
                <p className="text-sm text-stone-500">
                  {selectedSession.title || selectedSession.code} •{' '}
                  <span className={selectedSession.status === 'active' ? 'text-green-600' : 'text-stone-400'}>
                    {selectedSession.status === 'active' ? 'Actief' : 'Gesloten'}
                  </span>
                </p>
              </div>
              {selectedSession.status === 'closed' && (
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              )}
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nog geen deelnemers</p>
                <p className="text-sm mt-1">
                  Laat studenten de QR-code scannen om mee te doen
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-stone-700">
                {participants.map((participant) => (
                  <div key={participant.id} className="p-4">
                    <button
                      onClick={() => setExpandedParticipant(
                        expandedParticipant === participant.id ? null : participant.id
                      )}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <span className="text-amber-700 dark:text-amber-300 font-semibold">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-stone-800 dark:text-stone-100">
                            {participant.name}
                          </p>
                          <p className="text-sm text-stone-500">
                            {participant.determinations.length} determinatie(s)
                          </p>
                        </div>
                      </div>
                      {expandedParticipant === participant.id ? (
                        <ChevronUp className="w-5 h-5 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                      )}
                    </button>

                    {/* Expanded Determinations */}
                    {expandedParticipant === participant.id && (
                      <div className="mt-4 space-y-3 pl-13">
                        {participant.determinations.length === 0 ? (
                          <p className="text-sm text-stone-500 italic">
                            Nog geen determinaties
                          </p>
                        ) : (
                          participant.determinations.map((det) => (
                            <DeterminationCard
                              key={det.id}
                              determination={det}
                              onValidate={(approved) =>
                                handleValidate(participant.id, det.id, approved)
                              }
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Previous Sessions */}
        {sessions.filter(s => s.id !== activeSession?.id).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">
              Eerdere Sessies
            </h3>
            <div className="space-y-2">
              {sessions
                .filter(s => s.id !== activeSession?.id)
                .map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-stone-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-100">
                        {session.title || session.code}
                      </p>
                      <p className="text-sm text-stone-500">
                        {session.createdAt.toLocaleDateString('nl-NL')} •{' '}
                        <span className={session.status === 'active' ? 'text-green-600' : 'text-stone-400'}>
                          {session.status === 'active' ? 'Actief' : 'Gesloten'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'active' && (
                        <button
                          onClick={() => { setActiveSession(session); setSelectedSession(session); }}
                          className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                        >
                          Openen
                        </button>
                      )}
                      {session.status === 'closed' && (
                        <button
                          onClick={() => handleViewClosedSession(session)}
                          className="p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          title="Bekijken"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                Nieuwe Training Sessie
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Sessie titel (optioneel)
              </label>
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Bijv. AWN Cursus Maart 2024"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            {createError && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {createError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="flex-1 px-4 py-3 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Aanmaken...' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Determination Card Component
function DeterminationCard({
  determination,
  onValidate,
}: {
  determination: ParticipantDetermination;
  onValidate: (approved: boolean) => void;
}) {
  const [showSteps, setShowSteps] = useState(false);
  const hasDocentValidation = !!determination.docentValidation;
  const aiVerdict = determination.aiValidation?.verdict;

  return (
    <div className="bg-stone-50 dark:bg-stone-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-medium text-stone-800 dark:text-stone-100">
            {formatTypeName(determination.resultType)}
          </p>
          <button
            onClick={() => setShowSteps(s => !s)}
            className="text-sm text-stone-500 mt-1 hover:text-amber-600 transition-colors flex items-center gap-1"
          >
            {determination.steps.length} stappen • {determination.hintsUsed} hints
            {determination.steps.length > 0 && (
              showSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Steps list */}
          {showSteps && determination.steps.length > 0 && (
            <ol className="mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-400">
              {determination.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${step.answer === 'ja' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {step.answer === 'ja' ? 'J' : 'N'}
                  </span>
                  <span className="pt-0.5">{step.questionText}</span>
                </li>
              ))}
            </ol>
          )}

          {/* AI Validation Badge */}
          {aiVerdict && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${
              aiVerdict === 'correct'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : aiVerdict === 'onjuist'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {aiVerdict === 'correct' && <CheckCircle className="w-3 h-3" />}
              {aiVerdict === 'onjuist' && <XCircle className="w-3 h-3" />}
              {aiVerdict === 'twijfelachtig' && <AlertCircle className="w-3 h-3" />}
              AI: {aiVerdict}
            </div>
          )}
        </div>

        {/* Docent Validation Buttons */}
        {hasDocentValidation ? (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            determination.docentValidation?.approved
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {determination.docentValidation?.approved ? 'Goedgekeurd' : 'Afgekeurd'}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onValidate(true)}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Goedkeuren"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onValidate(false)}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Afkeuren"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
