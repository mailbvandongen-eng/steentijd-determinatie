import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface QuickStartReviewProps {
  imageUrl: string;
  familyLabel: string;
  targetLevelLabel: string;
  expectedTraits?: string[];
  commonConfusions?: string[];
  exampleOutcomes?: string[];
  isChecking: boolean;
  verdict: 'plausibel' | 'twijfelachtig' | 'onwaarschijnlijk' | null;
  feedback: string | null;
  error: string | null;
  onUseQuickStart: () => void;
  onUseFullRoute: () => void;
  onBack: () => void;
}

export function QuickStartReview({
  imageUrl,
  familyLabel,
  targetLevelLabel,
  expectedTraits = [],
  commonConfusions = [],
  exampleOutcomes = [],
  isChecking,
  verdict,
  feedback,
  error,
  onUseQuickStart,
  onUseFullRoute,
  onBack,
}: QuickStartReviewProps) {
  const preferFullRoute = verdict === 'onwaarschijnlijk';
  const quickStartLabel = preferFullRoute ? 'Toch stap in gebruiken' : 'Stap in gebruiken';
  const fullRouteLabel = preferFullRoute ? 'Gebruik volledige route (aanbevolen)' : 'Gebruik volledige route';

  const verdictStyles = verdict === 'plausibel'
    ? {
        box: 'border-green-200 bg-green-50',
        text: 'text-green-700',
        Icon: CheckCircle,
        title: 'AI vindt deze instap plausibel',
      }
    : verdict === 'onwaarschijnlijk'
      ? {
          box: 'border-red-200 bg-red-50',
          text: 'text-red-700',
          Icon: AlertCircle,
          title: 'AI vindt deze instap onwaarschijnlijk',
        }
      : {
          box: 'border-amber-200 bg-amber-50',
          text: 'text-amber-700',
          Icon: HelpCircle,
          title: 'AI is hier niet zeker van',
        };

  return (
    <div className="h-full bg-stone-50 flex flex-col overflow-hidden">
      <div className="bg-stone-800 p-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Stap in controleren</p>
          <p className="text-stone-400 text-xs">AI controleert alleen of deze instap verdedigbaar is</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Gekozen familie</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{familyLabel}</p>
          <p className="mt-1 text-sm text-stone-600">Beoogde route: {targetLevelLabel}</p>
        </div>

        {(expectedTraits.length > 0 || commonConfusions.length > 0) && (
          <div className="card border border-stone-200 bg-white space-y-3">
            {expectedTraits.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Waar AI op let</p>
                <ul className="mt-2 space-y-1 text-sm text-stone-700">
                  {expectedTraits.map((trait) => (
                    <li key={trait}>• {trait}</li>
                  ))}
                </ul>
              </div>
            )}
            {commonConfusions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Mogelijke verwarring</p>
                <p className="mt-1 text-sm text-stone-700">{commonConfusions.join(', ')}</p>
              </div>
            )}
            {exampleOutcomes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Verwachte subtype-richting</p>
                <p className="mt-1 text-sm text-stone-700">{exampleOutcomes.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Artefact</p>
          <img
            src={imageUrl}
            alt="Artefact"
            className="w-full max-h-64 object-contain rounded border border-stone-200"
          />
        </div>

        {isChecking ? (
          <div className="card border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <div>
                <p className="text-sm font-semibold text-blue-700">AI controleert de instap</p>
                <p className="text-xs text-blue-600">Dit is een plausibiliteitscheck, geen automatische determinatie.</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="card border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700">AI-check mislukt</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        ) : verdict ? (
          <div className={`card border ${verdictStyles.box}`}>
            <div className="flex items-start gap-3">
              <verdictStyles.Icon className={`w-6 h-6 shrink-0 ${verdictStyles.text}`} />
              <div>
                <p className={`text-sm font-semibold ${verdictStyles.text}`}>{verdictStyles.title}</p>
                {feedback && <p className="mt-1 text-sm text-stone-700 whitespace-pre-wrap">{feedback}</p>}
              </div>
            </div>
          </div>
        ) : null}

        <div className="card border border-stone-200 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Keuze</p>
          <p className="mt-1 text-sm text-stone-700">
            Je kunt instappen in deze familie of alsnog de volledige route lopen vanaf het begin. Het AI-advies is adviserend; jij beslist.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-stone-200 space-y-2 shrink-0">
        <button
          onClick={preferFullRoute ? onUseFullRoute : onUseQuickStart}
          disabled={isChecking}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
            preferFullRoute
              ? 'border border-stone-300 text-stone-800 hover:bg-stone-50'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {preferFullRoute ? fullRouteLabel : quickStartLabel}
        </button>
        <button
          onClick={preferFullRoute ? onUseQuickStart : onUseFullRoute}
          disabled={isChecking}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
            preferFullRoute
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
          }`}
        >
          {preferFullRoute ? quickStartLabel : fullRouteLabel}
        </button>
      </div>
    </div>
  );
}
