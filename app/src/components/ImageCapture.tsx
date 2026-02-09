import { useRef, useState, useCallback, useEffect } from 'react';
import type { LabeledImage } from '../types';

type CaptureMode = 'select' | 'camera-photo' | 'camera-video' | 'recording' | 'preview-photo' | 'preview-video' | 'multi-photo';

interface ImageCaptureProps {
  onCapture: (data: {
    type: 'photo' | 'video' | 'multi-photo';
    blob?: Blob;
    thumbnail?: string;
    images?: LabeledImage[];
    videoBlob?: Blob;
  }) => void;
}

const IMAGE_LABELS = [
  { key: 'dorsaal', label: 'Dorsaal (bovenzijde)', description: 'De rugzijde met afslagnegatieven' },
  { key: 'ventraal', label: 'Ventraal (onderzijde)', description: 'De buikzijde met slagbult' },
  { key: 'zijkant', label: 'Zijkant', description: 'Profiel van het artefact' },
  { key: 'extra', label: 'Extra', description: 'Aanvullende opname' },
] as const;

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('select');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [multiImages, setMultiImages] = useState<LabeledImage[]>([]);
  const [currentLabel, setCurrentLabel] = useState<LabeledImage['label']>('dorsaal');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const startCamera = useCallback(async (forVideo: boolean = false) => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: forVideo // Alleen audio voor video
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wacht tot video geladen is
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve).catch(() => resolve());
            };
          }
        });
      }

      setMode(forVideo ? 'camera-video' : 'camera-photo');
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
      setCameraError(`Kan camera niet openen: ${errorMessage}`);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setMode('preview-photo');
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    } catch {
      // Fallback als vp9 niet wordt ondersteund
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setMode('preview-video');
      stopCamera();
    };

    mediaRecorderRef.current.start(100);
    setIsRecording(true);
    setRecordingTime(0);
    setMode('recording');

    // Timer voor opnametijd
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }, [stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode(isVideo ? 'preview-video' : 'preview-photo');
  }, []);

  const createThumbnail = (source: HTMLImageElement | HTMLVideoElement): Promise<string> => {
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

      const srcWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const srcHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
      const minDim = Math.min(srcWidth, srcHeight);
      const sx = (srcWidth - minDim) / 2;
      const sy = (srcHeight - minDim) / 2;
      ctx.drawImage(source, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    });
  };

  const handleConfirmSingle = useCallback(async () => {
    if (!capturedBlob || !previewUrl) return;

    const isVideo = mode === 'preview-video';

    if (isVideo) {
      // Video thumbnail van eerste frame
      const video = document.createElement('video');
      video.src = previewUrl;
      video.muted = true;
      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve();
        video.load();
      });
      video.currentTime = 0;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const thumbnail = await createThumbnail(video);
      onCapture({
        type: 'video',
        videoBlob: capturedBlob,
        thumbnail,
      });
    } else {
      // Foto thumbnail
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const thumbnail = await createThumbnail(img);
      onCapture({
        type: 'photo',
        blob: capturedBlob,
        thumbnail,
      });
    }
  }, [capturedBlob, previewUrl, mode, onCapture]);

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

  const handleConfirmMulti = useCallback(() => {
    if (multiImages.length === 0) return;

    // Gebruik eerste foto als hoofdthumbnail
    onCapture({
      type: 'multi-photo',
      images: multiImages,
      thumbnail: multiImages[0].thumbnail,
    });
  }, [multiImages, onCapture]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setMode('select');
    setRecordingTime(0);
  }, [previewUrl]);

  const handleRemoveImage = useCallback((label: LabeledImage['label']) => {
    setMultiImages((prev) => prev.filter((i) => i.label !== label));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Selectiescherm
  if (mode === 'select') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-xl font-semibold text-center">Artefact vastleggen</h2>
        <p className="text-stone-600 text-center text-sm">
          Maak foto's, een video of upload bestaande bestanden
        </p>

        {cameraError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {cameraError}
          </div>
        )}

        <div className="space-y-3 mt-2">
          {/* Meerdere foto's */}
          <button
            onClick={() => setMode('multi-photo')}
            className="w-full btn-primary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m3-3H9" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Meerdere foto's</div>
              <div className="text-xs opacity-80">Dorsaal, ventraal en zijkant</div>
            </div>
          </button>

          {/* Enkele foto */}
          <button
            onClick={() => startCamera(false)}
            className="w-full btn-secondary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Enkele foto</div>
              <div className="text-xs opacity-80">Snelle opname met camera</div>
            </div>
          </button>

          {/* Video */}
          <button
            onClick={() => startCamera(true)}
            className="w-full btn-secondary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Video opnemen</div>
              <div className="text-xs opacity-80">Draai het artefact voor alle kanten</div>
            </div>
          </button>

          {/* Upload */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(e, file.type.startsWith('video/'));
                }
              }}
              className="hidden"
            />
          </div>
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
          <p className="text-stone-400 text-xs">Voeg foto's toe van verschillende zijden</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Bestaande foto's */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {IMAGE_LABELS.map(({ key, label }) => {
              const img = multiImages.find((i) => i.label === key);
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
                    <button
                      onClick={() => {
                        setCurrentLabel(key);
                        startCamera(false);
                      }}
                      className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:bg-stone-100"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs mt-1">{label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-stone-500 text-center">
            Minimaal 1 foto nodig. Meer foto's = betere determinatie.
          </p>
        </div>

        <div className="p-3 bg-white border-t border-stone-200 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setMultiImages([]);
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

  // Camera modus (foto)
  if (mode === 'camera-photo') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {currentLabel && multiImages.length > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {IMAGE_LABELS.find((l) => l.key === currentLabel)?.label}
            </div>
          )}
        </div>
        <div className="p-4 bg-stone-900 flex justify-center gap-4 shrink-0">
          <button
            onClick={() => {
              stopCamera();
              setMode(multiImages.length > 0 ? 'multi-photo' : 'select');
            }}
            className="btn-secondary"
          >
            Annuleren
          </button>
          <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-stone-400 hover:border-amber-500 transition-colors">
            <span className="sr-only">Foto maken</span>
          </button>
        </div>
      </div>
    );
  }

  // Camera modus (video)
  if (mode === 'camera-video' || mode === 'recording') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        <div className="p-4 bg-stone-900 flex justify-center gap-4 shrink-0">
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              stopCamera();
              setMode('select');
            }}
            className="btn-secondary"
          >
            Annuleren
          </button>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-red-500 rounded-full border-4 border-red-300 hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <span className="w-4 h-4 bg-white rounded-sm" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-red-600 rounded-full border-4 border-red-300 animate-pulse flex items-center justify-center"
            >
              <span className="w-6 h-6 bg-white rounded-sm" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Preview foto
  if (mode === 'preview-photo' && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="p-3 bg-white flex flex-col gap-2 shrink-0">
          {multiImages.length > 0 || currentLabel !== 'dorsaal' ? (
            <>
              <p className="text-xs text-stone-500 text-center">
                {IMAGE_LABELS.find((l) => l.key === currentLabel)?.label}
              </p>
              <div className="flex gap-2">
                <button onClick={handleRetake} className="btn-secondary flex-1">
                  Opnieuw
                </button>
                <button onClick={handleAddToMulti} className="btn-success flex-1">
                  Toevoegen
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleRetake} className="btn-secondary flex-1">
                Opnieuw
              </button>
              <button onClick={() => setMode('multi-photo')} className="btn-secondary flex-1">
                + Meer foto's
              </button>
              <button onClick={handleConfirmSingle} className="btn-success flex-1">
                Gebruiken
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Preview video
  if (mode === 'preview-video' && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <video
            src={previewUrl}
            controls
            className="max-h-full max-w-full"
          />
        </div>
        <div className="p-3 bg-white flex gap-2 shrink-0">
          <button onClick={handleRetake} className="btn-secondary flex-1">
            Opnieuw
          </button>
          <button onClick={handleConfirmSingle} className="btn-success flex-1">
            Gebruiken
          </button>
        </div>
      </div>
    );
  }

  return null;
}
