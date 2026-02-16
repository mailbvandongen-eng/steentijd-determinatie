import { useState, useCallback } from 'react';
import type { DeterminationSession, LabeledImage } from '../types';
import { formatTypeName } from '../lib/decisionTree';
import { createArchaeologicalSketch } from '../lib/sketch';
import { updateSession } from '../lib/db';

// Helper: converteer data URL naar File object
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

// Helper: converteer blob naar File object
function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

interface ResultViewProps {
  session: DeterminationSession;
  onNewDetermination: () => void;
  onViewHistory: () => void;
  onRedeterminate?: (session: DeterminationSession) => void;
}

export function ResultView({ session, onNewDetermination, onViewHistory, onRedeterminate }: ResultViewProps) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [generatingSketch, setGeneratingSketch] = useState<string | null>(null);
  const [sketchError, setSketchError] = useState<string | null>(null);
  const [sketchProgress, setSketchProgress] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxShowDrawing, setLightboxShowDrawing] = useState(false);

  // Initialiseer localImages: gebruik images array, of maak er een van de enkele thumbnail
  const [localImages, setLocalImages] = useState<LabeledImage[]>(() => {
    if (session.input.images && session.input.images.length > 0) {
      return session.input.images;
    }
    // Voor enkele foto zonder images array, maak een tijdelijke LabeledImage
    if (session.input.thumbnail) {
      return [{
        label: 'dorsaal' as const,
        blob: session.input.blob || new Blob(),
        thumbnail: session.input.thumbnail,
        drawing: undefined,
      }];
    }
    return [];
  });

  // Verzamel alle beschikbare afbeeldingen
  const allImages = localImages;
  const hasMultipleImages = allImages.length > 1;

  // Genereer archeologische tekening voor een foto
  const handleGenerateSketch = useCallback(async (imageIndex: number) => {
    const image = localImages[imageIndex];
    if (!image || generatingSketch) return;

    setGeneratingSketch(image.label);
    setSketchError(null);
    setSketchProgress(0);

    // Start progress timer (simuleer ~15 seconden)
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(95, Math.round((elapsed / 20) * 100));
      setSketchProgress(progress);
    }, 500);

    try {
      // Gebruik de thumbnail als bron (of blob indien beschikbaar)
      const source = image.thumbnail;
      console.log('Start tekening generatie voor:', image.label);
      const sketchDataUrl = await createArchaeologicalSketch(source);
      console.log('Tekening ontvangen, lengte:', sketchDataUrl?.length);

      // Update lokale state
      const updatedImages = [...localImages];
      updatedImages[imageIndex] = {
        ...image,
        drawing: sketchDataUrl,
      };
      setLocalImages(updatedImages);

      // Sla op in database
      if (session.id) {
        await updateSession(session.id, {
          input: {
            ...session.input,
            images: updatedImages,
          },
        });
      }
      setSketchProgress(100);
    } catch (err) {
      console.error('Tekening generatie mislukt:', err);
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
      setSketchError(`Fout: ${errorMessage}`);
    } finally {
      clearInterval(progressInterval);
      setGeneratingSketch(null);
    }
  }, [localImages, generatingSketch, session]);

  // Verwijder tekening
  const handleRemoveSketch = useCallback(async (imageIndex: number) => {
    const image = localImages[imageIndex];
    if (!image) return;

    const updatedImages = [...localImages];
    updatedImages[imageIndex] = {
      ...image,
      drawing: undefined,
    };
    setLocalImages(updatedImages);

    // Sla op in database
    if (session.id) {
      await updateSession(session.id, {
        input: {
          ...session.input,
          images: updatedImages,
        },
      });
    }
  }, [localImages, session]);

  // State voor delen
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Deel determinatie via Web Share API of fallback
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setShareSuccess(null);

    try {
      const typeName = session.result ? formatTypeName(session.result.type) : 'Onbekend artefact';
      const description = session.result?.description || '';
      const period = session.result?.period ? `Periode: ${session.result.period}` : '';
      const characteristics = session.result?.characteristics?.length
        ? `\nKenmerken:\n${session.result.characteristics.map(c => `• ${c}`).join('\n')}`
        : '';

      // Bouw de tekst op
      const shareText = [
        `🪨 Steentijd Determinatie`,
        ``,
        `Type: ${typeName}`,
        period,
        ``,
        description,
        characteristics,
        ``,
        `Gedetermineerd met de Steentijd app`,
      ].filter(Boolean).join('\n');

      // Verzamel afbeeldingen als files
      const files: File[] = [];

      for (let i = 0; i < localImages.length; i++) {
        const img = localImages[i];
        const labelNum = i + 1;

        // Voeg foto toe
        if (img.blob && img.blob.size > 0) {
          files.push(blobToFile(img.blob, `artefact-foto-${labelNum}.jpg`));
        } else if (img.thumbnail) {
          try {
            const file = await dataUrlToFile(img.thumbnail, `artefact-foto-${labelNum}.jpg`);
            files.push(file);
          } catch (e) {
            console.warn('Kon thumbnail niet converteren:', e);
          }
        }

        // Voeg tekening toe indien aanwezig
        if (img.drawing) {
          try {
            const file = await dataUrlToFile(img.drawing, `artefact-tekening-${labelNum}.png`);
            files.push(file);
          } catch (e) {
            console.warn('Kon tekening niet converteren:', e);
          }
        }
      }

      // Check of Web Share API beschikbaar is met file support
      const canShareFiles = navigator.canShare && files.length > 0 && navigator.canShare({ files });

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Steentijd: ${typeName}`,
            text: shareText,
            ...(canShareFiles ? { files } : {}),
          });
          setShareSuccess('Gedeeld!');
        } catch (err) {
          // User cancelled of error
          if ((err as Error).name !== 'AbortError') {
            throw err;
          }
        }
      } else {
        // Fallback: kopieer naar klembord en toon opties
        await navigator.clipboard.writeText(shareText);
        setShareSuccess('Tekst gekopieerd! Plak in WhatsApp of e-mail.');
      }
    } catch (err) {
      console.error('Delen mislukt:', err);
      // Fallback: probeer tekst te kopiëren
      try {
        const typeName = session.result ? formatTypeName(session.result.type) : 'Onbekend artefact';
        const simpleText = `Steentijd Determinatie: ${typeName}\n${session.result?.description || ''}`;
        await navigator.clipboard.writeText(simpleText);
        setShareSuccess('Tekst gekopieerd naar klembord');
      } catch {
        setShareSuccess('Delen niet beschikbaar op dit apparaat');
      }
    } finally {
      setIsSharing(false);
      // Verberg succes bericht na 3 seconden
      setTimeout(() => setShareSuccess(null), 3000);
    }
  }, [session, localImages]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - subtiele amber badge */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-amber-700">Determinatie voltooid</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Resultaat */}
        <div className="p-4">
          <div className="card">
            <h2 className="text-sm text-stone-500 uppercase tracking-wide">Resultaat</h2>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {session.result ? formatTypeName(session.result.type) : 'Onbekend'}
            </p>
            {session.result?.description && (
              <p className="text-stone-600 mt-2">{session.result.description}</p>
            )}
          </div>
        </div>

        {/* Thumbnail en beeldmateriaal */}
        {session.input.thumbnail && (
          <div className="px-4 pb-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-stone-500">Jouw artefact</h3>
                {hasMultipleImages && (
                  <button
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                  >
                    {showAllImages ? 'Verberg' : 'Toon alle foto\'s'}
                    <svg
                      className={`w-4 h-4 transition-transform ${showAllImages ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Hoofdafbeelding of grid van alle afbeeldingen */}
              {showAllImages && hasMultipleImages ? (
                <div className="space-y-3">
                  {allImages.map((img, idx) => {
                    const labelText = img.label === 'dorsaal' ? 'Foto 1' :
                                      img.label === 'ventraal' ? 'Foto 2' :
                                      img.label === 'zijkant' ? 'Foto 3' : 'Foto 4';
                    const isGenerating = generatingSketch === img.label;

                    return (
                      <div key={idx} className="border border-stone-200 rounded-lg p-2">
                        <div className="flex gap-2">
                          {/* Foto */}
                          <div className="relative flex-1">
                            <img
                              src={img.thumbnail}
                              alt={labelText}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => { setLightboxIndex(idx); setLightboxShowDrawing(false); }}
                            />
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                              {labelText}
                            </div>
                          </div>

                          {/* Tekening (indien aanwezig) */}
                          {img.drawing && (
                            <div className="relative flex-1">
                              <img
                                src={img.drawing}
                                alt={`Tekening ${labelText}`}
                                className="w-full aspect-square object-cover rounded-lg border border-stone-300 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => { setLightboxIndex(idx); setLightboxShowDrawing(true); }}
                              />
                              <div className="absolute bottom-1 left-1 bg-amber-600/80 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                                Tekening
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveSketch(idx); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                title="Verwijder tekening"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Tekening genereer knop */}
                        <div className="mt-2">
                          {!img.drawing ? (
                            <button
                              onClick={() => handleGenerateSketch(idx)}
                              disabled={!!generatingSketch}
                              className="w-full py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-70"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <span>AI tekent... {sketchProgress}%</span>
                                  </div>
                                  <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
                                    <div
                                      className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${sketchProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-amber-500">Dit duurt 10-20 seconden</span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    <span>Maak tekening</span>
                                  </div>
                                </>
                              )}
                            </button>
                          ) : (
                            <p className="text-xs text-stone-500 text-center">
                              Tekening toont bewerkingssporen
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <img
                    src={session.input.thumbnail}
                    alt="Artefact"
                    className="w-full max-w-xs mx-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => { setLightboxIndex(0); setLightboxShowDrawing(false); }}
                  />
                  {/* Toon tekening knop ook bij enkele foto weergave */}
                  {allImages.length === 1 && (
                    <div className="mt-3">
                      {allImages[0]?.drawing ? (
                        <div className="space-y-2">
                          <img
                            src={allImages[0].drawing}
                            alt="Tekening"
                            className="w-full max-w-xs mx-auto rounded-lg border border-stone-300"
                          />
                          <div className="flex gap-2 justify-center">
                            <span className="text-xs text-amber-600 font-medium">Archeologische tekening</span>
                            <button
                              onClick={() => handleRemoveSketch(0)}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Verwijderen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateSketch(0)}
                          disabled={generatingSketch !== null}
                          className="w-full max-w-xs mx-auto py-3 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-70"
                        >
                          {generatingSketch ? (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                <span>AI tekent... {sketchProgress}%</span>
                              </div>
                              <div className="w-full max-w-[200px] bg-amber-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${sketchProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-amber-500">Dit duurt 10-20 seconden</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Maak archeologische tekening</span>
                              </div>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Foutmelding */}
              {sketchError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{sketchError}</p>
                  <p className="text-xs text-red-400 text-center mt-1">Controleer je internetverbinding en probeer opnieuw</p>
                </div>
              )}

              {hasMultipleImages && !showAllImages && (
                <p className="text-xs text-stone-400 text-center mt-2">
                  {allImages.length} foto's beschikbaar - toon alle voor tekeningen
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Analyse details */}
        <div className="px-4 pb-4">
          <div className="card">
            <h3 className="text-sm text-stone-500 mb-3">AI Analyse</h3>
            <div className="space-y-3">
              {/* Periode */}
              {session.result?.period && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500 w-24">Periode:</span>
                  <span className="text-sm text-stone-700">{session.result.period}</span>
                </div>
              )}

              {/* Betrouwbaarheid */}
              {session.result?.confidence && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500 w-24">Zekerheid:</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    session.result.confidence === 'hoog'
                      ? 'bg-green-100 text-green-800'
                      : session.result.confidence === 'gemiddeld'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {session.result.confidence.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Kenmerken */}
              {session.result?.characteristics && session.result.characteristics.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-stone-500 block mb-1">Gevonden kenmerken:</span>
                  <div className="space-y-1">
                    {session.result.characteristics.map((char, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-stone-50 rounded">
                        <span className="text-amber-600 text-xs">•</span>
                        <span className="text-sm text-stone-700">{char}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volledige analyse (uitklapbaar) */}
              {session.result?.fullAnalysis && (
                <details className="mt-2">
                  <summary className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer font-medium">
                    Volledige AI-analyse bekijken
                  </summary>
                  <div className="mt-2 p-3 bg-stone-50 rounded text-xs text-stone-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {session.result.fullAnalysis}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acties */}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 shrink-0 space-y-2">
        {/* Succes bericht voor delen */}
        {shareSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg text-center">
            {shareSuccess}
          </div>
        )}

        {/* Delen knop */}
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSharing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Voorbereiden...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Delen via WhatsApp of e-mail
            </>
          )}
        </button>

        {/* Opnieuw determineren - alleen als er foto's zijn en callback beschikbaar is */}
        {onRedeterminate && (session.input.images?.length || session.input.thumbnail) && (
          <button
            onClick={() => onRedeterminate(session)}
            className="w-full py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Opnieuw determineren met deze foto's
          </button>
        )}
        <div className="flex gap-3">
          <button onClick={onViewHistory} className="btn-secondary flex-1">
            Geschiedenis
          </button>
          <button onClick={onNewDetermination} className="btn-primary flex-1">
            Nieuwe determinatie
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {lightboxIndex + 1} / {allImages.length}
              {lightboxShowDrawing && allImages[lightboxIndex].drawing ? ' (Tekening)' : ' (Foto)'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              className="w-10 h-10 flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>

          {/* Image */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxShowDrawing && allImages[lightboxIndex].drawing
                ? allImages[lightboxIndex].drawing
                : allImages[lightboxIndex].thumbnail}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center justify-center gap-4">
            {/* Vorige */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : allImages.length - 1);
                setLightboxShowDrawing(false);
              }}
              className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-xl hover:bg-white/30"
            >
              ‹
            </button>

            {/* Toggle foto/tekening */}
            {allImages[lightboxIndex].drawing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxShowDrawing(!lightboxShowDrawing);
                }}
                className="px-4 py-2 rounded-full bg-white/20 text-white text-sm hover:bg-white/30"
              >
                {lightboxShowDrawing ? 'Toon foto' : 'Toon tekening'}
              </button>
            )}

            {/* Volgende */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex < allImages.length - 1 ? lightboxIndex + 1 : 0);
                setLightboxShowDrawing(false);
              }}
              className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-xl hover:bg-white/30"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
