import { Camera, Archive, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'capture' | 'history') => void;
  onShowWelcome: () => void;
}

export function Sidebar({ currentView, onNavigate, onShowWelcome }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();

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
          label="Nieuwe determinatie"
          active={currentView === 'capture'}
          onClick={() => onNavigate('capture')}
        />
        <NavItem
          icon={<Archive className="w-5 h-5" />}
          label="Geschiedenis"
          active={currentView === 'history'}
          onClick={() => onNavigate('history')}
        />
      </nav>

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
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'hover:bg-stone-100 dark:hover:bg-stone-700/50'
      }`}
      style={{ color: active ? undefined : 'var(--text-secondary)' }}
    >
      {icon}
      {label}
    </button>
  );
}
