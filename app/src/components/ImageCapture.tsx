import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, ImagePlus, ChevronRight, X, Plus, Upload } from 'lucide-react';
import type { LabeledImage } from '../types';

type CaptureMode = 'select' | 'preview-photo' | 'multi-photo';
type CaptureSource = 'camera' | 'upload';

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
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isCompressing, setIsCompressing] = useState(false);
  const [captureSource, setCaptureSource] = useState<CaptureSource>('camera');
  const [isDragging, setIsDragging] = useState(false);

  const previewImgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // Helper: verwerk een file naar LabeledImage
  const processFileToImage = useCallback(async (file: File, label: LabeledImage['label']): Promise<LabeledImage> => {
    let imageBlob: Blob = file;

    if (file.size > MAX_FILE_SIZE) {
      try {
        imageBlob = await compressImage(file);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }

    // Maak thumbnail (behoud aspect ratio)
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    const canvas = document.createElement('canvas');
    const maxSize = 400;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
    URL.revokeObjectURL(url);

    return { label, blob: imageBlob, thumbnail };
  }, []);

  // Handler voor multi-file upload (bulk)
  const handleMultiFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = '';

    setIsCompressing(true);
    const newImages: LabeledImage[] = [...multiImages];
    const filesToProcess = Array.from(files).slice(0, 4 - newImages.length);

    for (const file of filesToProcess) {
      const usedLabels = new Set(newImages.map(img => img.label));
      const nextLabel = IMAGE_LABELS.find(l => !usedLabels.has(l.key));
      if (nextLabel) {
        const labeledImage = await processFileToImage(file, nextLabel.key);
        newImages.push(labeledImage);
      }
    }

    setMultiImages(newImages);
    setIsCompressing(false);
  }, [multiImages, processFileToImage]);

  // Handler voor enkele foto in grid (camera of upload)
  const handleSingleFileForGrid = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, targetLabel: LabeledImage['label']) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsCompressing(true);
    const labeledImage = await processFileToImage(file, targetLabel);

    setMultiImages(prev => {
      const filtered = prev.filter(img => img.label !== targetLabel);
      return [...filtered, labeledImage];
    });
    setIsCompressing(false);
  }, [processFileToImage]);

  // Handler voor camera foto capture (met preview)
  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let imageBlob: Blob = file;

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

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    // Ga naar multi-photo mode met upload source
    setCaptureSource('upload');
    setIsInMultiPhotoMode(true);
    setMode('multi-photo');

    // Verwerk bestanden
    setIsCompressing(true);
    const newImages: LabeledImage[] = [];
    const filesToProcess = files.slice(0, 4);

    for (const file of filesToProcess) {
      const usedLabels = new Set(newImages.map(img => img.label));
      const nextLabel = IMAGE_LABELS.find(l => !usedLabels.has(l.key));
      if (nextLabel) {
        const labeledImage = await processFileToImage(file, nextLabel.key);
        newImages.push(labeledImage);
      }
    }

    setMultiImages(newImages);
    setIsCompressing(false);
  }, [processFileToImage]);

  const createThumbnail = (source: HTMLImageElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      // Behoud aspect ratio, max 400px
      const maxSize = 400;
      const scale = Math.min(maxSize / source.width, maxSize / source.height);
      canvas.width = source.width * scale;
      canvas.height = source.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
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
      const img = previewImgRef.current;
      // Start met 80% van de afbeelding, behoud aspect ratio
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offsetX = imgRect.left - containerRect.left;
      const offsetY = imgRect.top - containerRect.top;
      const width = imgRect.width * 0.8;
      const height = imgRect.height * 0.8;
      setCropBox({
        x: offsetX + (imgRect.width - width) / 2,
        y: offsetY + (imgRect.height - height) / 2,
        width,
        height,
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
    const cropWidth = cropBox.width * scaleX;
    const cropHeight = cropBox.height * scaleY;

    // Maak canvas voor cropped afbeelding
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

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

  // Verplaats crop box
  const handleCropDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!cropContainerRef.current) return;
    e.preventDefault();

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
      event.preventDefault();
      const pos = getPos(event);
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      setCropBox({
        ...startBox,
        x: Math.max(0, Math.min(containerRect.width - startBox.width, startBox.x + dx)),
        y: Math.max(0, Math.min(containerRect.height - startBox.height, startBox.y + dy)),
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
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [cropBox]);

  // Resize crop box via hoeken
  const handleCropResize = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br', e: React.TouchEvent | React.MouseEvent) => {
    if (!cropContainerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const container = cropContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const minSize = 50;

    const getPos = (event: TouchEvent | MouseEvent) => {
      if ('touches' in event) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
    };

    const startPos = getPos(e.nativeEvent as TouchEvent | MouseEvent);
    const startBox = { ...cropBox };

    const onMove = (event: TouchEvent | MouseEvent) => {
      event.preventDefault();
      const pos = getPos(event);
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      let newBox = { ...startBox };

      if (corner === 'tl') {
        newBox.x = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + dx));
        newBox.y = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + dy));
        newBox.width = startBox.width - (newBox.x - startBox.x);
        newBox.height = startBox.height - (newBox.y - startBox.y);
      } else if (corner === 'tr') {
        newBox.y = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + dy));
        newBox.width = Math.max(minSize, Math.min(containerRect.width - startBox.x, startBox.width + dx));
        newBox.height = startBox.height - (newBox.y - startBox.y);
      } else if (corner === 'bl') {
        newBox.x = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + dx));
        newBox.width = startBox.width - (newBox.x - startBox.x);
        newBox.height = Math.max(minSize, Math.min(containerRect.height - startBox.y, startBox.height + dy));
      } else if (corner === 'br') {
        newBox.width = Math.max(minSize, Math.min(containerRect.width - startBox.x, startBox.width + dx));
        newBox.height = Math.max(minSize, Math.min(containerRect.height - startBox.y, startBox.height + dy));
      }

      setCropBox(newBox);
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
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
      <div
        className="h-full flex flex-col overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-amber-500/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-dashed border-amber-500 flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-amber-600" />
              <span className="text-lg font-semibold text-amber-700">Sleep foto's hierheen</span>
              <span className="text-sm text-stone-500">Max 4 foto's</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Foto('s) maken - opent multi-photo mode met camera */}
          <button
            onClick={() => {
              setCaptureSource('camera');
              setIsInMultiPhotoMode(true);
              setMode('multi-photo');
            }}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Camera className="w-7 h-7 text-amber-600" />
            </div>
            <div className="text-left flex-1">
              <span className="font-semibold text-stone-900 block">Foto('s) maken</span>
              <span className="text-sm text-stone-500">Maak 1-4 foto's met je camera</span>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </button>

          {/* Foto('s) uploaden - opent multi-photo mode met galerij */}
          <button
            onClick={() => {
              setCaptureSource('upload');
              setIsInMultiPhotoMode(true);
              setMode('multi-photo');
            }}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
              <ImagePlus className="w-7 h-7 text-stone-600" />
            </div>
            <div className="text-left flex-1">
              <span className="font-semibold text-stone-900 block">Foto('s) uploaden</span>
              <span className="text-sm text-stone-500">Kies 1-4 bestaande foto's</span>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </button>

          {/* Drop zone hint */}
          <div className="mt-4 p-4 border-2 border-dashed border-stone-200 rounded-xl text-center">
            <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
            <span className="text-sm text-stone-400">Of sleep foto's hierheen</span>
          </div>
        </div>
      </div>
    );
  }

  // Multi-photo modus
  if (mode === 'multi-photo') {
    const isCamera = captureSource === 'camera';
    const emptySlots = IMAGE_LABELS.filter(l => !multiImages.find(img => img.label === l.key)).length;

    return (
      <div className="flex flex-col h-full">
        <div className="bg-stone-800 p-3 shrink-0">
          <h2 className="text-white font-semibold">Foto's {isCamera ? 'maken' : 'uploaden'}</h2>
          <p className="text-stone-400 text-xs">
            {isCamera
              ? 'Tik op een vakje om een foto te maken'
              : `Tik op een vakje of selecteer meerdere foto's tegelijk`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Multi-upload knop voor upload mode */}
          {!isCamera && emptySlots > 0 && (
            <label className="block mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center cursor-pointer hover:bg-amber-100 transition-colors">
              <span className="text-sm text-amber-700 font-medium">
                Selecteer {emptySlots > 1 ? `tot ${emptySlots} foto's` : '1 foto'} tegelijk
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultiFileUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Foto grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {IMAGE_LABELS.map(({ key, label }) => {
              const img = multiImages.find((i) => i.label === key);
              const inputId = `photo-input-${key}`;
              return (
                <div
                  key={key}
                  className={`relative border-2 rounded-lg overflow-hidden min-h-[120px] ${
                    img ? 'border-green-500 bg-stone-100' : 'border-dashed border-stone-300 aspect-square'
                  }`}
                >
                  {img ? (
                    <>
                      <img
                        src={img.thumbnail}
                        alt={label}
                        className="w-full h-full object-contain bg-stone-50"
                      />
                      <button
                        onClick={() => handleRemoveImage(key)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
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
                      {isCamera ? (
                        <Camera className="w-8 h-8" />
                      ) : (
                        <Plus className="w-8 h-8" />
                      )}
                      <span className="text-xs mt-1">{label}</span>
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        {...(isCamera ? { capture: 'environment' as const } : {})}
                        onChange={(e) => {
                          if (isCamera) {
                            setCurrentLabel(key);
                            handleCameraCapture(e);
                          } else {
                            handleSingleFileForGrid(e, key);
                          }
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
                  width: cropBox.width,
                  height: cropBox.height,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                }}
                onMouseDown={handleCropDrag}
                onTouchStart={handleCropDrag}
              >
                {/* Hoek resize handles - grotere touch targets */}
                <div
                  className="absolute -top-2 -left-2 w-6 h-6 cursor-nw-resize touch-none flex items-center justify-center"
                  onMouseDown={(e) => handleCropResize('tl', e)}
                  onTouchStart={(e) => handleCropResize('tl', e)}
                >
                  <div className="w-3 h-3 border-t-2 border-l-2 border-white bg-amber-500/50" />
                </div>
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 cursor-ne-resize touch-none flex items-center justify-center"
                  onMouseDown={(e) => handleCropResize('tr', e)}
                  onTouchStart={(e) => handleCropResize('tr', e)}
                >
                  <div className="w-3 h-3 border-t-2 border-r-2 border-white bg-amber-500/50" />
                </div>
                <div
                  className="absolute -bottom-2 -left-2 w-6 h-6 cursor-sw-resize touch-none flex items-center justify-center"
                  onMouseDown={(e) => handleCropResize('bl', e)}
                  onTouchStart={(e) => handleCropResize('bl', e)}
                >
                  <div className="w-3 h-3 border-b-2 border-l-2 border-white bg-amber-500/50" />
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-6 h-6 cursor-se-resize touch-none flex items-center justify-center"
                  onMouseDown={(e) => handleCropResize('br', e)}
                  onTouchStart={(e) => handleCropResize('br', e)}
                >
                  <div className="w-3 h-3 border-b-2 border-r-2 border-white bg-amber-500/50" />
                </div>
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
