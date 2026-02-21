import { useState } from 'react';
import { LogIn, LogOut, RefreshCw, Cloud, CloudOff, Sun, Moon } from 'lucide-react';
import { resetWelcomeModal } from './WelcomeModal';
import { QueryViewer } from './QueryViewer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { isDark, toggleTheme } = useTheme();

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
          <div className="absolute right-0 top-full mt-1 w-64 rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {/* User section */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              {loading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
                  Laden...
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">Ingelogd</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <CloudOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Niet ingelogd</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vondsten zijn lokaal</p>
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
                    className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3 disabled:opacity-50"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} style={{ color: 'var(--text-muted)' }} />
                    {isSyncing ? 'Synchroniseren...' : 'Synchroniseren'}
                  </button>

                  {/* Sync result */}
                  {syncResult && (
                    <div className={`mx-4 mb-2 p-2 rounded text-xs ${
                      syncResult.errors.length > 0
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
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
                    className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <LogOut className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    Uitloggen
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <LogIn className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  Inloggen met Google
                </button>
              )}

              <div className="my-1" style={{ borderTop: '1px solid var(--border-color)' }} />

              {/* Dark mode toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                )}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>

              <button
                onClick={handleResetWelcome}
                className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Welkomstscherm tonen
              </button>
              <button
                onClick={handleShowQuery}
                className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                AI Query bekijken
              </button>
            </div>
            {/* Versie onderaan */}
            <div className="px-4 py-2 text-xs text-center" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
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
