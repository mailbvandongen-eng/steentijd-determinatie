import { useState } from 'react';
import { LogIn, LogOut, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { resetWelcomeModal } from './WelcomeModal';
import { QueryViewer } from './QueryViewer';
import { useAuth } from '../contexts/AuthContext';
import { syncSessions, type SyncResult } from '../lib/sync';

interface SettingsMenuProps {
  onShowWelcome: () => void;
  version: string;
}

export function SettingsMenu({ onShowWelcome, version }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQueryViewer, setShowQueryViewer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleResetWelcome = () => {
    resetWelcomeModal();
    onShowWelcome();
    setIsOpen(false);
  };

  const handleShowQuery = () => {
    setShowQueryViewer(true);
    setIsOpen(false);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncSessions(user.uid);
      setSyncResult(result);
      // Auto-hide result after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncResult({
        uploaded: 0,
        downloaded: 0,
        errors: [err instanceof Error ? err.message : 'Sync mislukt'],
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-stone-200 z-50 overflow-hidden">
            {/* User section */}
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                  Laden...
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-green-600">Ingelogd</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                    <CloudOff className="w-4 h-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-600">Niet ingelogd</p>
                    <p className="text-xs text-stone-400">Vondsten zijn lokaal</p>
                  </div>
                </div>
              )}
            </div>

            <div className="py-1">
              {/* Login/Logout button */}
              {user ? (
                <>
                  {/* Sync button */}
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 text-stone-500 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchroniseren...' : 'Synchroniseren'}
                  </button>

                  {/* Sync result */}
                  {syncResult && (
                    <div className={`mx-4 mb-2 p-2 rounded text-xs ${
                      syncResult.errors.length > 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {syncResult.errors.length > 0 ? (
                        <p>{syncResult.errors[0]}</p>
                      ) : (
                        <p>
                          {syncResult.uploaded > 0 && `${syncResult.uploaded} geüpload`}
                          {syncResult.uploaded > 0 && syncResult.downloaded > 0 && ', '}
                          {syncResult.downloaded > 0 && `${syncResult.downloaded} gedownload`}
                          {syncResult.uploaded === 0 && syncResult.downloaded === 0 && 'Alles is al gesynchroniseerd'}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3"
                  >
                    <LogOut className="w-5 h-5 text-stone-500" />
                    Uitloggen
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5 text-stone-500" />
                  Inloggen met Google
                </button>
              )}

              <div className="border-t border-stone-100 my-1" />

              <button
                onClick={handleResetWelcome}
                className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Welkomstscherm tonen
              </button>
              <button
                onClick={handleShowQuery}
                className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                AI Query bekijken
              </button>
            </div>
            {/* Versie onderaan */}
            <div className="px-4 py-2 border-t border-stone-100 text-xs text-stone-400 text-center">
              v{version}
            </div>
          </div>
        </>
      )}

      {/* Query Viewer Modal */}
      <QueryViewer isOpen={showQueryViewer} onClose={() => setShowQueryViewer(false)} />
    </div>
  );
}
