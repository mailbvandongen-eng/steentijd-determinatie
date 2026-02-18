import { useState, useEffect } from 'react';

const STORAGE_KEY = 'steentijd-hide-welcome';

// Changelog - nieuwste bovenaan
const CHANGELOG = [
  { version: '1.1.21', date: '18 feb 2026', changes: ['Verduidelijking: Claude voor analyse, OpenAI voor tekeningen (betaalde diensten)'] },
  { version: '1.1.20', date: '18 feb 2026', changes: ['Vierkant bijsnijden (1:1 ratio, past bij AI tekeningen)', 'Duidelijkere UI voor vierkante foto\'s'] },
  { version: '1.1.19', date: '18 feb 2026', changes: ['Meer ruimte rond foto\'s in fullscreen viewer', 'Betere weergave tekeningen'] },
  { version: '1.1.18', date: '18 feb 2026', changes: ['Agressievere foto compressie (max 1.5MB, 1500px)', 'Alle foto\'s worden nu automatisch verkleind'] },
  { version: '1.1.17', date: '17 feb 2026', changes: ['Verbeterde foto/tekening layout in resultaten', 'Lightbox foto\'s met betere afstand tot randen'] },
  { version: '1.1.16', date: '17 feb 2026', changes: ['Onnodige teksten verwijderd'] },
  { version: '1.1.15', date: '17 feb 2026', changes: ['Onzinnige foto-labels verwijderd', 'Fix: foto/tekening layout in resultaat'] },
  { version: '1.1.14', date: '17 feb 2026', changes: ['PDF export van determinatie', 'Drag & drop foto upload', 'Zoeken in geschiedenis'] },
  { version: '1.1.13', date: '17 feb 2026', changes: ['Lucide iconen voor consistente UI', 'Dynamisch bijsnijden (sleep hoeken om formaat aan te passen)', 'Multi-foto upload fix'] },
  { version: '1.1.12', date: '17 feb 2026', changes: ['Vindplaats/context invoer voor betere determinatie', 'Compactere resultaat weergave met uitklapbare details', 'Icoon-knoppen voor delen en opnieuw determineren'] },
  { version: '1.1.11', date: '16 feb 2026', changes: ['AI analyse details tonen (periode, zekerheid, kenmerken)', 'Volledige AI-analyse uitklapbaar'] },
  { version: '1.1.10', date: '16 feb 2026', changes: ['Verbeterde foutafhandeling bij tekening generatie'] },
  { version: '1.1.9', date: '16 feb 2026', changes: ['Fullscreen foto viewer met bladeren', 'Verbeterde feedback bij tekening generatie'] },
  { version: '1.1.8', date: '16 feb 2026', changes: ['AI-gegenereerde archeologische tekeningen (via OpenAI)', 'Deel determinatie via WhatsApp of e-mail'] },
  { version: '1.1.6', date: '14 feb 2026', changes: ['Links naar AWN Werkgroep Steentijd toegevoegd', 'Informatie over determinatie-algoritme en vondstkaart'] },
  { version: '1.1.5', date: '14 feb 2026', changes: ['Vereenvoudigde interface: alleen foto\'s', 'Video-analyse komt later met zelflerende AI'] },
  { version: '1.1.4', date: '13 feb 2026', changes: ['Altijd native telefoon camera (met zoom en scherpstelling)', 'Stabielere video opname'] },
  { version: '1.1.3', date: '13 feb 2026', changes: ['Uitleg over werking en toekomst toegevoegd', 'Subtielere UI voor voltooide determinaties', 'Beeldmateriaal viewer bij resultaten', 'Opnieuw determineren met bestaande foto\'s', '8 video frames (selecteer er 5 voor analyse)'] },
  { version: '1.1.2', date: '13 feb 2026', changes: ['Fix: video analyse werkt nu correct', 'Automatische frame extractie uit video voor AI'] },
  { version: '1.0.13', date: '12 feb 2026', changes: ['Direct naar determinatie scherm', 'Verbeterde video opname', 'Consistente amber kleurenschema'] },
  { version: '1.0.11', date: '12 feb 2026', changes: ['Verbeterde video opname compatibiliteit (iOS/Android)', 'Aparte upload knoppen voor foto en video', 'Professionelere camera interface'] },
  { version: '1.0.10', date: '12 feb 2026', changes: ['Fix: meerdere foto\'s workflow', 'Fix: video opname preview', 'Volledige AI analyse wordt opgeslagen bij vondst', 'AI Query viewer in menu'] },
  { version: '1.0.9', date: '12 feb 2026', changes: ['Instellingenmenu rechtsboven toegevoegd', 'Optie om welkomstscherm opnieuw te tonen'] },
  { version: '1.0.8', date: '12 feb 2026', changes: ['Wijzigingsbeheer toegevoegd aan welkomstscherm'] },
  { version: '1.0.7', date: '12 feb 2026', changes: ['Welkomstscherm met uitleg toegevoegd'] },
  { version: '1.0.6', date: '12 feb 2026', changes: ['Auto-compressie van grote foto\'s en video\'s (max 5MB)', 'Camera knoppen blijven nu zichtbaar op mobiel'] },
  { version: '1.0.5', date: '11 feb 2026', changes: ['Foto bijsnijden functie', 'Formaat invoer voor artefact'] },
  { version: '1.0.4', date: '10 feb 2026', changes: ['Verbeterde layout op mobiel'] },
  { version: '1.0.3', date: '9 feb 2026', changes: ['Fix voor foto preview knoppen'] },
  { version: '1.0.2', date: '8 feb 2026', changes: ['Vereenvoudigde interface', 'Meerdere foto\'s workflow'] },
  { version: '1.0.1', date: '7 feb 2026', changes: ['Eerste publieke versie'] },
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
                <StepItem number={4} title="Tekening maken" description="Genereer een wetenschappelijke archeologische tekening van je artefact" />
                <StepItem number={5} title="Delen" description="Deel je determinatie inclusief foto's via WhatsApp of e-mail" />
              </div>
            </section>

            <section className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Tips voor goede foto's</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• <strong>Maak vierkante foto's</strong> (gebruik de "Vierkant" knop om bij te snijden)</li>
                <li>• Gebruik goed licht (daglicht werkt het beste)</li>
                <li>• Maak scherpe foto's van dichtbij</li>
                <li>• Fotografeer meerdere kanten van het artefact</li>
                <li>• Gebruik een neutrale achtergrond</li>
              </ul>
            </section>

            {/* AWN Werkgroep Steentijd */}
            <section className="bg-stone-50 rounded-xl p-3 border border-stone-200">
              <h3 className="text-sm font-semibold text-stone-800 mb-2">AWN Werkgroep Steentijd</h3>
              <div className="text-xs text-stone-600 space-y-2">
                <p>
                  Deze app is gebaseerd op het <strong>determinatie-algoritme</strong> van de
                  AWN Landelijke Werkgroep Steentijd. De werkgroep staat open voor iedereen
                  met interesse in prehistorische stenen artefacten — van beginner tot expert.
                </p>
                <div className="space-y-1.5 mt-3">
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-stone-700 hover:text-amber-700 transition-colors"
                  >
                    <span className="text-stone-400">→</span>
                    <span>Over de werkgroep</span>
                  </a>
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/determinatie/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-stone-700 hover:text-amber-700 transition-colors"
                  >
                    <span className="text-stone-400">→</span>
                    <span>Determinatie-algoritme</span>
                  </a>
                  <a
                    href="https://awn-archeologie.nl/werkgroep/steentijd/vondstkaart/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-stone-700 hover:text-amber-700 transition-colors"
                  >
                    <span className="text-stone-400">→</span>
                    <span>Vondstkaart Nederland</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Over dit project */}
            <section className="bg-stone-50 rounded-xl p-3 border border-stone-200">
              <h3 className="text-sm font-semibold text-stone-800 mb-2">Over deze app</h3>
              <div className="text-xs text-stone-600 space-y-2">
                <p>
                  <strong>Proof of Concept</strong> — Experimentele app om te onderzoeken
                  of AI-gestuurde determinatie van stenen artefacten haalbaar en nuttig is.
                </p>
                <p>
                  <strong>Hoe werkt de AI?</strong> — De app gebruikt twee betaalde AI-diensten:
                  <strong>Claude</strong> (Anthropic) voor de determinatie-analyse, en
                  <strong>OpenAI</strong> voor het genereren van archeologische tekeningen.
                  Bij elke analyse wordt het AWN determinatie-algoritme als context meegestuurd.
                  De modellen zijn <em>stateless</em>: ze onthouden niets van eerdere sessies en worden
                  niet getraind door gebruik van deze app.
                </p>
                <p>
                  <strong>Transparantie</strong> — Via het menu (☰) kun je de volledige AI-query
                  bekijken die naar het model wordt gestuurd.
                </p>
                <p className="text-stone-500 pt-1">
                  <strong>Toekomst:</strong> trainbaar model, referentiedatabase, video-analyse met zelflerende AI.
                </p>
              </div>
            </section>

            <section className="rounded-xl p-3 border border-amber-200 bg-amber-50/50">
              <p className="text-xs text-amber-800">
                <strong>Let op:</strong> Dit is een hulpmiddel. Raadpleeg bij twijfel
                altijd een expert van de AWN Werkgroep Steentijd.
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
