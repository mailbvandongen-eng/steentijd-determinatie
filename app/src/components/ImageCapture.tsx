import { useRef, useState, useCallback, useEffect } from 'react';
import type { LabeledImage } from '../types';

type CaptureMode = 'select' | 'preview-photo' | 'multi-photo';

interface ImageCaptureProps {
  onCapture: (data: {
    type: 'photo' | 'multi-photo';
    blob?: Blob;
    thumbnail?: string;
    images?: LabeledImage[];
  }) => void;
}

const IMAGE_LABELS = [
  { key: 'dorsaal', label: 'Foto 1' },
  { key: 'ventraal', label: 'Foto 2' },
  { key: 'zijkant', label: 'Foto 3' },
  { key: 'extra', label: 'Foto 4' },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Comprimeer afbeelding tot onder MAX_FILE_SIZE
const compressImage = async (file: File): Promise<Blob> => {
  // Als het geen afbeelding is of al klein genoeg, retourneer onveranderd
  if (!file.type.startsWith('image/') || file.size <= MAX_FILE_SIZE) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;
      let quality = 0.9;

      // Begin met originele grootte, verklein indien nodig
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Probeer verschillende combinaties van grootte en kwaliteit
      const tryCompress = async (): Promise<Blob> => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((res) => {
          canvas.toBlob(res, 'image/jpeg', quality);
        });

        if (!blob) return file;

        // Als klein genoeg, klaar
        if (blob.size <= MAX_FILE_SIZE) {
          return blob;
        }

        // Verlaag eerst kwaliteit
        if (quality > 0.5) {
          quality -= 0.1;
          return tryCompress();
        }

        // Als kwaliteit al laag is, verklein afmetingen
        if (width > 1000 || height > 1000) {
          width = Math.round(width * 0.8);
          height = Math.round(height * 0.8);
          quality = 0.8; // Reset kwaliteit
          return tryCompress();
        }

        // Laatste poging met minimale instellingen
        return blob;
      };

      const result = await tryCompress();
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('select');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [multiImages, setMultiImages] = useState<LabeledImage[]>([]);
  const [currentLabel, setCurrentLabel] = useState<LabeledImage['label']>('dorsaal');
  const [isInMultiPhotoMode, setIsInMultiPhotoMode] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, size: 200 });
  const [isCompressing, setIsCompressing] = useState(false);

  const previewImgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  // Refs voor native camera inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhotoInputRef = useRef<HTMLInputElement>(null);

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // Handler voor native camera foto capture
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input zodat dezelfde file opnieuw geselecteerd kan worden
    e.target.value = '';

    let imageBlob: Blob = file;

    // Comprimeer afbeelding als deze te groot is
    if (file.size > MAX_FILE_SIZE) {
      setIsCompressing(true);
      try {
        imageBlob = await compressImage(file);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
      setIsCompressing(false);
    }

    const url = URL.createObjectURL(imageBlob);
    setCapturedBlob(imageBlob);
    setPreviewUrl(url);
    setMode('preview-photo');
  }, []);

  const createThumbnail = (source: HTMLImageElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const srcWidth = source.width;
      const srcHeight = source.height;
      const minDim = Math.min(srcWidth, srcHeight);
      const sx = (srcWidth - minDim) / 2;
      const sy = (srcHeight - minDim) / 2;
      ctx.drawImage(source, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    });
  };

  const handleConfirmSingle = useCallback(async () => {
    if (!capturedBlob) {
      console.error('Geen bestand beschikbaar');
      setMode('select');
      return;
    }

    // Foto thumbnail
    let thumbnail = '';

    if (previewUrl) {
      try {
        const img = new Image();
        img.src = previewUrl;
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
          }),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        thumbnail = await createThumbnail(img);
      } catch (err) {
        console.error('Could not create image thumbnail:', err);
      }
    }

    onCapture({
      type: 'photo',
      blob: capturedBlob,
      thumbnail,
    });
  }, [capturedBlob, previewUrl, onCapture]);

  const handleAddToMulti = useCallback(async () => {
    if (!capturedBlob || !previewUrl) return;

    const img = new Image();
    img.src = previewUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const thumbnail = await createThumbnail(img);

    setMultiImages((prev) => [
      ...prev.filter((i) => i.label !== currentLabel), // Vervang bestaande met zelfde label
      { label: currentLabel, blob: capturedBlob, thumbnail },
    ]);

    // Reset voor volgende foto
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setMode('multi-photo');

    // Selecteer volgende lege label
    const usedLabels = new Set([...multiImages.map((i) => i.label), currentLabel]);
    const nextLabel = IMAGE_LABELS.find((l) => !usedLabels.has(l.key));
    if (nextLabel) setCurrentLabel(nextLabel.key);
  }, [capturedBlob, previewUrl, currentLabel, multiImages]);

  const handleConfirmMulti = useCallback(async () => {
    if (multiImages.length === 0) return;

    // Gebruik eerste foto thumbnail als hoofdthumbnail
    const thumbnail = multiImages[0]?.thumbnail || '';

    // Reset multi-photo mode
    setIsInMultiPhotoMode(false);

    onCapture({
      type: 'multi-photo',
      images: multiImages,
      thumbnail,
    });
  }, [multiImages, onCapture]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setIsCropping(false);
    // Als we in multi-photo mode zijn, ga terug naar multi-photo overzicht
    if (isInMultiPhotoMode) {
      setMode('multi-photo');
    } else {
      setMode('select');
    }
  }, [previewUrl, isInMultiPhotoMode]);

  const handleRemoveImage = useCallback((label: LabeledImage['label']) => {
    setMultiImages((prev) => prev.filter((i) => i.label !== label));
  }, []);

  // Crop functionaliteit
  const initCrop = useCallback(() => {
    if (previewImgRef.current && cropContainerRef.current) {
      const container = cropContainerRef.current;
      const size = Math.min(container.clientWidth, container.clientHeight) * 0.6;
      setCropBox({
        x: (container.clientWidth - size) / 2,
        y: (container.clientHeight - size) / 2,
        size,
      });
    }
    setIsCropping(true);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!previewImgRef.current || !cropContainerRef.current || !capturedBlob) return;

    const img = previewImgRef.current;
    const container = cropContainerRef.current;

    // Bereken schaal tussen weergave en originele afbeelding
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Bereken offset van afbeelding in container
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offsetX = imgRect.left - containerRect.left;
    const offsetY = imgRect.top - containerRect.top;

    // Bereken crop positie op originele afbeelding
    const cropX = Math.max(0, (cropBox.x - offsetX) * scaleX);
    const cropY = Math.max(0, (cropBox.y - offsetY) * scaleY);
    const cropSize = cropBox.size * Math.max(scaleX, scaleY);

    // Maak canvas voor cropped afbeelding
    const canvas = document.createElement('canvas');
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);

    const croppedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });

    if (croppedBlob) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCapturedBlob(croppedBlob);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
    }
    setIsCropping(false);
  }, [cropBox, capturedBlob, previewUrl]);

  const handleCropDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!cropContainerRef.current) return;

    const container = cropContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    const getPos = (event: TouchEvent | MouseEvent) => {
      if ('touches' in event) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
    };

    const startPos = getPos(e.nativeEvent as TouchEvent | MouseEvent);
    const startBox = { ...cropBox };

    const onMove = (event: TouchEvent | MouseEvent) => {
      const pos = getPos(event);
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      setCropBox({
        ...startBox,
        x: Math.max(0, Math.min(containerRect.width - startBox.size, startBox.x + dx)),
        y: Math.max(0, Math.min(containerRect.height - startBox.size, startBox.y + dy)),
      });
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  }, [cropBox]);

  // Compressie loading scherm
  if (isCompressing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-semibold text-center">Foto verkleinen...</h2>
        <p className="text-stone-600 text-sm text-center">
          De foto is groter dan 5 MB en wordt gecomprimeerd
        </p>
      </div>
    );
  }

  // Selectiescherm
  if (mode === 'select') {
    return (
      <div className="h-full flex flex-col overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-3">
          {/* Meerdere foto's - Primary card */}
          <button
            onClick={() => {
              setIsInMultiPhotoMode(true);
              setMode('multi-photo');
            }}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="font-semibold text-stone-900 block">Meerdere foto's</span>
              <span className="text-sm text-stone-500">Meest nauwkeurige determinatie</span>
            </div>
            <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Enkele foto - opent native camera */}
          <button
            onClick={() => {
              setIsInMultiPhotoMode(false);
              photoInputRef.current?.click();
            }}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="font-semibold text-stone-900 block">Enkele foto</span>
              <span className="text-sm text-stone-500">Snelle opname met telefoon camera</span>
            </div>
            <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Elegante divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">of kies bestaande foto</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Upload knop */}
          <button
            onClick={() => uploadPhotoInputRef.current?.click()}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="font-semibold text-stone-900 block">Foto uploaden</span>
              <span className="text-sm text-stone-500">Kies een bestaande foto</span>
            </div>
            <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Native camera input (met capture voor telefoon camera) */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* Upload input (zonder capture, opent galerij) */}
          <input
            ref={uploadPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Multi-photo modus
  if (mode === 'multi-photo') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-stone-800 p-3 shrink-0">
          <h2 className="text-white font-semibold">Foto's toevoegen</h2>
          <p className="text-stone-400 text-xs">Tik op een vakje om een foto te maken</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Bestaande foto's */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {IMAGE_LABELS.map(({ key, label }) => {
              const img = multiImages.find((i) => i.label === key);
              const inputId = `photo-input-${key}`;
              return (
                <div
                  key={key}
                  className={`relative border-2 rounded-lg overflow-hidden aspect-square ${
                    img ? 'border-green-500' : 'border-dashed border-stone-300'
                  }`}
                >
                  {img ? (
                    <>
                      <img src={img.thumbnail} alt={label} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(key)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                        {label}
                      </div>
                    </>
                  ) : (
                    <label
                      htmlFor={inputId}
                      className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:bg-stone-100 cursor-pointer"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs mt-1">{label}</span>
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          setCurrentLabel(key);
                          handleFileSelect(e);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-stone-500 text-center">
            Minimaal 1 foto nodig. Meer foto's = betere determinatie.
          </p>
        </div>

        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setMultiImages([]);
              setIsInMultiPhotoMode(false);
              setMode('select');
            }}
            className="btn-secondary flex-1"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirmMulti}
            disabled={multiImages.length === 0}
            className="btn-success flex-1 disabled:opacity-50"
          >
            Doorgaan ({multiImages.length} foto's)
          </button>
        </div>
      </div>
    );
  }

  // Preview foto
  if (mode === 'preview-photo' && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div
          ref={cropContainerRef}
          className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden"
        >
          <img
            ref={previewImgRef}
            src={previewUrl}
            alt="Preview"
            className="max-h-full max-w-full object-contain"
          />
          {/* Crop overlay */}
          {isCropping && (
            <>
              {/* Donkere overlay */}
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
              {/* Crop box */}
              <div
                className="absolute border-2 border-white bg-transparent cursor-move touch-none"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.size,
                  height: cropBox.size,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                }}
                onMouseDown={handleCropDrag}
                onTouchStart={handleCropDrag}
              >
                {/* Hoek markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
              </div>
            </>
          )}
        </div>
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white flex flex-col gap-2 shrink-0">
          {isCropping ? (
            // Crop modus
            <div className="flex gap-2">
              <button onClick={() => setIsCropping(false)} className="btn-secondary flex-1">
                Annuleren
              </button>
              <button onClick={applyCrop} className="btn-success flex-1">
                Bijsnijden
              </button>
            </div>
          ) : isInMultiPhotoMode ? (
            // Bezig met multi-photo - toevoegen aan collectie
            <div className="flex gap-1">
              <button onClick={handleRetake} className="btn-secondary flex-1 px-2 py-2 text-sm">
                Opnieuw
              </button>
              <button onClick={initCrop} className="btn-secondary flex-1 px-2 py-2 text-sm">
                Bijsnijden
              </button>
              <button onClick={handleAddToMulti} className="btn-success flex-1 px-2 py-2 text-sm">
                Toevoegen
              </button>
            </div>
          ) : (
            // Enkele foto - kan gebruiken
            <div className="flex gap-1">
              <button onClick={handleRetake} className="btn-secondary flex-1 px-2 py-2 text-sm">
                Opnieuw
              </button>
              <button onClick={initCrop} className="btn-secondary flex-1 px-2 py-2 text-sm">
                Bijsnijden
              </button>
              <button onClick={handleConfirmSingle} className="btn-success flex-1 px-2 py-2 text-sm">
                Gebruiken
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
