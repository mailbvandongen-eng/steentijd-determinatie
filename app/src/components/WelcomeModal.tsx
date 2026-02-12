import { useState, useEffect } from 'react';

const STORAGE_KEY = 'steentijd-hide-welcome';

// Changelog - nieuwste bovenaan
const CHANGELOG = [
  { version: '1.0.10', date: '12 feb 2025', changes: ['Fix: meerdere foto\'s workflow', 'Fix: video opname preview', 'Volledige AI analyse wordt opgeslagen bij vondst', 'AI Query viewer in menu'] },
  { version: '1.0.9', date: '12 feb 2025', changes: ['Instellingenmenu rechtsboven toegevoegd', 'Optie om welkomstscherm opnieuw te tonen'] },
  { version: '1.0.8', date: '12 feb 2025', changes: ['Wijzigingsbeheer toegevoegd aan welkomstscherm'] },
  { version: '1.0.7', date: '12 feb 2025', changes: ['Welkomstscherm met uitleg toegevoegd'] },
  { version: '1.0.6', date: '12 feb 2025', changes: ['Auto-compressie van grote foto\'s en video\'s (max 5MB)', 'Camera knoppen blijven nu zichtbaar op mobiel'] },
  { version: '1.0.5', date: '11 feb 2025', changes: ['Foto bijsnijden functie', 'Formaat invoer voor artefact'] },
  { version: '1.0.4', date: '10 feb 2025', changes: ['Verbeterde layout op mobiel'] },
  { version: '1.0.3', date: '9 feb 2025', changes: ['Fix voor foto preview knoppen'] },
  { version: '1.0.2', date: '8 feb 2025', changes: ['Vereenvoudigde interface', 'Meerdere foto\'s workflow'] },
  { version: '1.0.1', date: '7 feb 2025', changes: ['Eerste publieke versie'] },
];

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

            {/* Changelog */}
            <section>
              <h3 className="font-semibold text-stone-800 mb-2">Wat is nieuw?</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {CHANGELOG.map((release) => (
                  <div key={release.version} className="text-xs border-l-2 border-amber-300 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-700">v{release.version}</span>
                      <span className="text-stone-400">{release.date}</span>
                    </div>
                    <ul className="text-stone-500 mt-0.5">
                      {release.changes.map((change, i) => (
                        <li key={i}>• {change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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

export function resetWelcomeModal() {
  localStorage.removeItem(STORAGE_KEY);
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
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
