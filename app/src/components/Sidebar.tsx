import { useState } from 'react';
import { Camera, Archive, Sun, Moon, Info, LogIn, LogOut, Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { syncSessions, forceSyncAll, type SyncResult } from '../lib/sync';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'capture' | 'history') => void;
  onShowWelcome: () => void;
}

export function Sidebar({ currentView, onNavigate, onShowWelcome }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

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

  const handleForceSync = async () => {
    if (!user) return;
    if (!confirm('Dit reset de sync status en uploadt ALLES opnieuw naar de cloud.\n\nGebruik dit alleen als items niet correct synchroniseren.\n\nDoorgaan?')) return;

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await forceSyncAll(user.uid);
      setSyncResult({
        uploaded: result.uploaded,
        downloaded: result.downloaded,
        errors: result.errors.length > 0 ? result.errors : [],
      });
      setTimeout(() => setSyncResult(null), 8000);
    } catch (err) {
      console.error('Force sync failed:', err);
      setSyncResult({
        uploaded: 0,
        downloaded: 0,
        errors: [err instanceof Error ? err.message : 'Force sync mislukt'],
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <aside className="desktop-sidebar">
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="text-xl font-bold text-amber-600">STEENTIJD</h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Determineren van artefacten</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <NavItem
          icon={<Camera className="w-5 h-5" />}
          label="Startscherm"
          active={currentView === 'capture'}
          onClick={() => onNavigate('capture')}
        />
        <NavItem
          icon={<Archive className="w-5 h-5" />}
          label="Mijn vondsten"
          active={currentView === 'history'}
          onClick={() => onNavigate('history')}
        />
      </nav>

      {/* User section */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm px-2" style={{ color: 'var(--text-secondary)' }}>
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
            Laden...
          </div>
        ) : user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Cloud className="w-4 h-4 text-green-500" />
              <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            {syncResult && (
              <div className={`mx-2 p-2 rounded text-xs ${
                syncResult.errors.length > 0
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {syncResult.errors.length > 0 ? (
                  <p>{syncResult.errors[0]}</p>
                ) : (
                  <p>
                    {syncResult.uploaded > 0 && `${syncResult.uploaded}↑`}
                    {syncResult.uploaded > 0 && syncResult.downloaded > 0 && ' '}
                    {syncResult.downloaded > 0 && `${syncResult.downloaded}↓`}
                    {syncResult.uploaded === 0 && syncResult.downloaded === 0 && '✓ Gesynchroniseerd'}
                  </p>
                )}
              </div>
            )}
            <NavItem
              icon={<RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />}
              label={isSyncing ? 'Syncing...' : 'Synchroniseren'}
              onClick={handleSync}
            />
            <NavItem
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Forceer volledige sync"
              onClick={handleForceSync}
              subtle
            />
            <NavItem
              icon={<LogOut className="w-5 h-5" />}
              label="Uitloggen"
              onClick={handleSignOut}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <CloudOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Niet ingelogd</span>
            </div>
            <NavItem
              icon={<LogIn className="w-5 h-5" />}
              label="Inloggen met Google"
              onClick={handleSignIn}
            />
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <NavItem
          icon={isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          label={isDark ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />
        <NavItem
          icon={<Info className="w-5 h-5" />}
          label="Over deze app"
          onClick={onShowWelcome}
        />
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  subtle?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, subtle, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : subtle
          ? 'hover:bg-stone-100 dark:hover:bg-stone-700/50 opacity-60 hover:opacity-100'
          : 'hover:bg-stone-100 dark:hover:bg-stone-700/50'
      }`}
      style={{ color: active ? undefined : 'var(--text-secondary)' }}
    >
      {icon}
      {label}
    </button>
  );
}
