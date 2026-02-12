import { DETERMINATION_CONTEXT } from '../lib/aiAnalysis';

interface QueryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueryViewer({ isOpen, onClose }: QueryViewerProps) {
  if (!isOpen) return null;

  const userPrompt = `Analyseer deze foto('s) van een mogelijk stenen artefact. Geef je analyse in het volgende format:

**Type:** [type artefact of "geen artefact" of "onduidelijk"]
**Periode:** [geschatte periode of "onbekend"]
**Betrouwbaarheid:** [laag/gemiddeld/hoog]

**Beschrijving:**
[Gedetailleerde beschrijving van wat je ziet]

**Kenmerken:**
- [kenmerk 1]
- [kenmerk 2]
- ...

**Opmerkingen:**
[Eventuele opmerkingen over fotokwaliteit, wat je niet kunt beoordelen, etc.]`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-2xl max-h-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-stone-800 text-white p-4 flex items-center justify-between shrink-0">
            <h2 className="font-semibold">AI Query (Prompt)</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <section>
              <h3 className="font-semibold text-stone-800 mb-2 text-sm">System Prompt (Context)</h3>
              <div className="bg-stone-100 rounded-lg p-3 text-xs text-stone-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {DETERMINATION_CONTEXT.trim()}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-stone-800 mb-2 text-sm">User Prompt (Vraag)</h3>
              <div className="bg-amber-50 rounded-lg p-3 text-xs text-stone-700 font-mono whitespace-pre-wrap">
                {userPrompt}
              </div>
            </section>

            <section className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Info:</strong> De foto's worden als base64-encoded afbeeldingen meegestuurd.
                Bij meerdere foto's worden max. 5 afbeeldingen geanalyseerd.
                Het model is Claude claude-sonnet-4-20250514 via de Anthropic API.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-200 shrink-0">
            <button
              onClick={onClose}
              className="w-full btn-primary py-2"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
