import { useState, useEffect } from 'react';
import { ChevronLeft, Check, Info } from 'lucide-react';
import { analyzeImage, blobToBase64 } from '../lib/aiAnalysis';
import type { AnalysisResult } from '../lib/aiAnalysis';
import type { LabeledImage } from '../types';

interface AIAnalysisProps {
  images: LabeledImage[];
  singleImage?: { blob: Blob; thumbnail: string };
  videoFrames?: LabeledImage[]; // Automatisch geëxtraheerde frames uit video
  onComplete: (result: {
    type: string;
    description: string;
    period?: string;
    confidence?: 'laag' | 'gemiddeld' | 'hoog';
    characteristics?: string[];
    aiAnalysis: AnalysisResult;
  }) => void;
  onBack: () => void;
}

export function AIAnalysis({ images, singleImage, videoFrames, onComplete, onBack }: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzeAllImages, setAnalyzeAllImages] = useState(true);
  const [sizeInput, setSizeInput] = useState('');
  const [contextInput, setContextInput] = useState('');

  // Verzamel alle beschikbare images (handmatige foto's + video frames)
  const manualImages = singleImage
    ? [{ label: 'dorsaal' as const, blob: singleImage.blob, thumbnail: singleImage.thumbnail }]
    : images;

  const hasVideoFrames = videoFrames && videoFrames.length > 0;

  // Frame selectie state
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<Set<number>>(new Set());

  // Max aantal frames dat nog geselecteerd kan worden (5 totaal minus handmatige foto's)
  const maxSelectableFrames = Math.max(0, 5 - manualImages.length);

  // Initialiseer frame selectie wanneer videoFrames beschikbaar wordt
  useEffect(() => {
    if (videoFrames && videoFrames.length > 0) {
      const initialSelected = new Set<number>();
      const framesToSelect = Math.min(maxSelectableFrames, videoFrames.length);
      for (let i = 0; i < framesToSelect; i++) {
        initialSelected.add(i);
      }
      setSelectedFrameIndices(initialSelected);
    }
  }, [videoFrames, maxSelectableFrames]);

  // Geselecteerde video frames
  const selectedVideoFrames = videoFrames
    ? videoFrames.filter((_, idx) => selectedFrameIndices.has(idx))
    : [];

  // Alle afbeeldingen voor analyse (handmatige + geselecteerde video frames)
  // Als er geen selectie is maar wel video frames, gebruik dan alle frames (tot max 5)
  const effectiveVideoFrames = selectedVideoFrames.length > 0
    ? selectedVideoFrames
    : (videoFrames || []).slice(0, maxSelectableFrames);

  const allImages = [...manualImages, ...effectiveVideoFrames];

  const toggleFrameSelection = (idx: number) => {
    setSelectedFrameIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else if (newSet.size < maxSelectableFrames) {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      if (allImages.length === 0) {
        setResult({ success: false, error: 'Geen afbeelding beschikbaar. Selecteer minimaal 1 frame.' });
        return;
      }

      // Bij video frames gebruiken we altijd alle geselecteerde frames
      // Bij alleen foto's respecteren we de analyzeAllImages toggle
      const imagesToAnalyze = hasVideoFrames
        ? allImages.slice(0, 5) // Gebruik geselecteerde frames (al gefilterd)
        : analyzeAllImages
        ? allImages.slice(0, 5)
        : [allImages[0]];

      // Converteer alle afbeeldingen naar base64
      const base64Images = await Promise.all(
        imagesToAnalyze.map(img => blobToBase64(img.blob))
      );

      const analysisResult = await analyzeImage(base64Images, sizeInput || undefined, contextInput || undefined);
      setResult(analysisResult);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Analyse mislukt',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (result?.success) {
      onComplete({
        type: result.type || 'Onbekend',
        description: result.description || '',
        period: result.period,
        confidence: result.confidence,
        characteristics: result.characteristics,
        aiAnalysis: result,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="bg-stone-800 p-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-semibold">AI Analyse</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Afbeeldingen */}
        <div className="card mb-3">
          {/* Handmatige foto's */}
          {manualImages.length > 0 && (
            <>
              <p className="text-xs text-stone-500 mb-2 font-medium">
                {manualImages.length > 1 ? "JOUW FOTO'S" : 'JOUW FOTO'}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {manualImages.map((img, idx) => (
                  <div
                    key={`manual-${idx}`}
                    className="shrink-0 rounded border-2 border-stone-200 overflow-hidden"
                  >
                    <img
                      src={img.thumbnail}
                      alt={`Foto ${idx + 1}`}
                      className="h-16 w-16 object-cover"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Video frames met selectie */}
          {hasVideoFrames && (
            <>
              <div className="flex items-center justify-between mt-2 mb-2">
                <p className="text-xs text-stone-500 font-medium">
                  VIDEO FRAMES ({selectedFrameIndices.size} van {videoFrames.length} geselecteerd)
                </p>
                {maxSelectableFrames > 0 && (
                  <p className="text-xs text-blue-600">
                    Max {maxSelectableFrames} selecteerbaar
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {videoFrames.map((img, idx) => {
                  const isSelected = selectedFrameIndices.has(idx);
                  const canSelect = isSelected || selectedFrameIndices.size < maxSelectableFrames;
                  return (
                    <button
                      key={`frame-${idx}`}
                      onClick={() => canSelect && toggleFrameSelection(idx)}
                      disabled={!canSelect && !isSelected}
                      className={`relative rounded overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : canSelect
                          ? 'border-stone-200 hover:border-blue-300'
                          : 'border-stone-100 opacity-50'
                      }`}
                    >
                      <img
                        src={img.thumbnail}
                        alt={`Frame ${idx + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className={`absolute bottom-0 left-0 right-0 text-white text-[10px] text-center py-0.5 ${
                        isSelected ? 'bg-blue-600' : 'bg-black/50'
                      }`}>
                        {idx + 1}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-400 mt-2 text-center">
                Tik op frames om te selecteren/deselecteren (max 5 totaal voor AI analyse)
              </p>
            </>
          )}

          {/* Analyse optie */}
          {allImages.length > 1 && !hasVideoFrames && (
            <div className="mt-3 pt-3 border-t border-stone-200">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={analyzeAllImages}
                  onChange={(e) => setAnalyzeAllImages(e.target.checked)}
                  className="rounded border-stone-300"
                />
                Alle {Math.min(allImages.length, 5)} afbeeldingen analyseren (nauwkeuriger)
              </label>
              <p className="text-xs text-stone-500 mt-1">
                {analyzeAllImages
                  ? 'Claude bekijkt alle afbeeldingen voor een complete analyse'
                  : 'Alleen de eerste afbeelding wordt geanalyseerd (sneller/goedkoper)'}
              </p>
            </div>
          )}

          {/* Info over geselecteerde afbeeldingen bij video */}
          {hasVideoFrames && allImages.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Info className="w-4 h-4 text-blue-500" />
                <span>
                  {manualImages.length > 0
                    ? `${manualImages.length} foto('s) + ${selectedFrameIndices.size} video frames = ${allImages.length} afbeeldingen`
                    : `${selectedFrameIndices.size} video frames geselecteerd`}
                </span>
              </div>
            </div>
          )}

          {/* Grootte invoer */}
          <div className="mt-3 pt-3 border-t border-stone-200">
            <label className="block text-sm text-stone-700 mb-1">
              Afmetingen in cm (optioneel)
            </label>
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="bijv. 3x8 of 0,5x1"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Vindplaats/context invoer */}
          <div className="mt-3 pt-3 border-t border-stone-200">
            <label className="block text-sm text-stone-700 mb-1">
              Vindplaats/context (optioneel)
            </label>
            <input
              type="text"
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="bijv. Limburg, oppervlaktevondst, in situ"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Analyse resultaat */}
        {result && (
          <div className="card mb-3">
            {result.success ? (
              <>
                {/* Type en periode */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-medium">
                    {result.type}
                  </span>
                  {result.period && result.period !== 'Onbekend' && (
                    <span className="bg-stone-100 text-stone-700 px-2 py-1 rounded text-sm">
                      {result.period}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result.confidence === 'hoog'
                        ? 'bg-green-100 text-green-800'
                        : result.confidence === 'laag'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {result.confidence} vertrouwen
                  </span>
                </div>

                {/* Kenmerken */}
                {result.characteristics && result.characteristics.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-stone-500 font-medium mb-1">KENMERKEN</p>
                    <ul className="text-sm text-stone-700 space-y-1">
                      {result.characteristics.map((char, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600">•</span>
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Volledige beschrijving */}
                <details className="text-sm">
                  <summary className="text-stone-500 cursor-pointer hover:text-stone-700">
                    Volledige analyse bekijken
                  </summary>
                  <div className="mt-2 p-2 bg-stone-50 rounded text-stone-700 whitespace-pre-wrap text-xs">
                    {result.description}
                  </div>
                </details>
              </>
            ) : (
              <div className="text-red-600">
                <p className="font-medium">Analyse mislukt</p>
                <p className="text-sm">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Analyzing indicator */}
        {isAnalyzing && (
          <div className="card mb-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full" />
              <div>
                <p className="font-medium text-stone-800">Analyseren...</p>
                <p className="text-sm text-stone-500">Dit kan enkele seconden duren</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructies */}
        {!result && !isAnalyzing && (
          <div className="card bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>AI Analyse</strong><br />
              Claude analyseert je {allImages.length > 1 ? `${allImages.length} afbeeldingen` : 'foto'} en bepaalt het type artefact, de periode,
              en geeft een uitgebreide beschrijving van de kenmerken.
            </p>
            {hasVideoFrames && (
              <p className="text-xs text-blue-600 mt-2">
                Video frames worden automatisch meegenomen voor betere 3D-beoordeling.
              </p>
            )}
            <p className="text-xs text-amber-600 mt-2">
              Max 20 analyses per dag.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 shrink-0">
        {result?.success ? (
          <div className="flex gap-2">
            <button onClick={handleAnalyze} className="btn-secondary flex-1">
              Opnieuw
            </button>
            <button onClick={handleConfirm} className="btn-success flex-1">
              Opslaan
            </button>
          </div>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary w-full py-4 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyseren...' : 'Start AI Analyse'}
          </button>
        )}
      </div>
    </div>
  );
}
