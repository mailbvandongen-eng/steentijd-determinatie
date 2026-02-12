import { useState } from 'react';
import { resetWelcomeModal } from './WelcomeModal';

interface SettingsMenuProps {
  onShowWelcome: () => void;
}

export function SettingsMenu({ onShowWelcome }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleResetWelcome = () => {
    resetWelcomeModal();
    onShowWelcome();
    setIsOpen(false);
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
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-stone-200 z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={handleResetWelcome}
                className="w-full px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-100 flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Welkomstscherm tonen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
