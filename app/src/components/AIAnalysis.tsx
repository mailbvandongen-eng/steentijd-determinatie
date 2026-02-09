import { useState } from 'react';
import { analyzeImage, blobToBase64 } from '../lib/aiAnalysis';
import type { AnalysisResult } from '../lib/aiAnalysis';
import type { LabeledImage } from '../types';

interface AIAnalysisProps {
  images: LabeledImage[];
  singleImage?: { blob: Blob; thumbnail: string };
  onComplete: (result: { type: string; description: string; aiAnalysis: AnalysisResult }) => void;
  onBack: () => void;
}

export function AIAnalysis({ images, singleImage, onComplete, onBack }: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Verzamel alle beschikbare images
  const allImages = singleImage
    ? [{ label: 'foto' as const, blob: singleImage.blob, thumbnail: singleImage.thumbnail }]
    : images;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Gebruik de eerste/huidige afbeelding voor analyse
      const imageToAnalyze = allImages[currentImageIndex];
      if (!imageToAnalyze) {
        setResult({ success: false, error: 'Geen afbeelding beschikbaar' });
        return;
      }

      const base64 = await blobToBase64(imageToAnalyze.blob);
      const analysisResult = await analyzeImage(base64);
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
        aiAnalysis: result,
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-stone-800 p-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-semibold">AI Analyse</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Afbeeldingen */}
        <div className="card mb-3">
          <p className="text-xs text-stone-500 mb-2 font-medium">
            {allImages.length > 1 ? 'JOUW AFBEELDINGEN' : 'JOUW AFBEELDING'}
          </p>

          {allImages.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`shrink-0 rounded border-2 overflow-hidden ${
                    idx === currentImageIndex ? 'border-amber-500' : 'border-stone-200'
                  }`}
                >
                  <img
                    src={img.thumbnail}
                    alt={img.label}
                    className="h-16 w-16 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <img
              src={allImages[0]?.thumbnail}
              alt="Artefact"
              className="w-full max-h-48 object-contain rounded border border-stone-200"
            />
          )}

          {allImages.length > 1 && (
            <p className="text-xs text-stone-500 mt-2 text-center">
              Analyseren: {allImages[currentImageIndex]?.label || 'foto'}
            </p>
          )}
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
              Claude analyseert je foto en bepaalt het type artefact, de periode,
              en geeft een uitgebreide beschrijving van de kenmerken.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Max 10 analyses per dag.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-white border-t border-stone-200 shrink-0">
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
