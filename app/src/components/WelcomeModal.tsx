import { useState, useEffect } from 'react';

const STORAGE_KEY = 'steentijd-hide-welcome';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md max-h-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 text-center">
            <h2 className="text-xl font-bold">Welkom bij Steentijd</h2>
            <p className="text-amber-200 text-sm">AI Determinatie van stenen artefacten</p>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <section>
              <h3 className="font-semibold text-stone-800 mb-2">Hoe werkt het?</h3>
              <div className="space-y-3">
                <StepItem number={1} title="Foto's maken" description="Maak meerdere foto's van je artefact (bovenkant, onderkant, zijkanten)" />
                <StepItem number={2} title="AI Analyse" description="De AI analyseert je foto's met kennis van het AWN determinatie-algoritme" />
                <StepItem number={3} title="Resultaat" description="Ontvang een determinatie met type, periode en beschrijving" />
              </div>
            </section>

            <section className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Tips voor goede foto's</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Gebruik goed licht (daglicht werkt het beste)</li>
                <li>• Maak scherpe foto's van dichtbij</li>
                <li>• Fotografeer meerdere kanten van het artefact</li>
                <li>• Gebruik een neutrale achtergrond</li>
              </ul>
            </section>

            <section className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-600">
                <strong>Let op:</strong> Dit is een hulpmiddel voor determinatie.
                Raadpleeg bij twijfel altijd een expert van de AWN Landelijke Werkgroep Steentijd.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-600">Niet meer tonen</span>
            </label>
            <button
              onClick={handleClose}
              className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 flex items-center justify-center bg-amber-100 text-amber-800 rounded-full text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="text-sm font-medium text-stone-800">{title}</h4>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
    </div>
  );
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY);
    if (!hidden) {
      setIsOpen(true);
    }
  }, []);

  return {
    isOpen,
    close: () => setIsOpen(false),
  };
}
