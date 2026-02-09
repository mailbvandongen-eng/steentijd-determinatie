import { useRef, useState, useCallback } from 'react';

interface ImageCaptureProps {
  onCapture: (blob: Blob, thumbnail: string) => void;
}

export function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('camera');
    } catch (err) {
      console.error('Camera error:', err);
      alert('Kan camera niet openen. Controleer de permissies.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
          setMode('preview');
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode('preview');
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedBlob && previewUrl) {
      // Maak thumbnail
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop naar vierkant
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        onCapture(capturedBlob, thumbnail);
      };
      img.src = previewUrl;
    }
  }, [capturedBlob, previewUrl, onCapture]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setMode('select');
  }, [previewUrl]);

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     stopCamera();
  //     if (previewUrl) URL.revokeObjectURL(previewUrl);
  //   };
  // }, [stopCamera, previewUrl]);

  if (mode === 'select') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-xl font-semibold text-center">Artefact vastleggen</h2>
        <p className="text-stone-600 text-center text-sm">
          Maak een foto of upload een bestaande afbeelding van het artefact
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <button onClick={startCamera} className="btn-primary flex flex-col items-center gap-2 py-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Camera</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex flex-col items-center gap-2 py-6"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Upload</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className="flex flex-col h-full">
        <video ref={videoRef} autoPlay playsInline className="flex-1 bg-black object-cover" />
        <div className="p-4 bg-stone-900 flex justify-center gap-4">
          <button onClick={() => { stopCamera(); setMode('select'); }} className="btn-secondary">
            Annuleren
          </button>
          <button onClick={capturePhoto} className="btn-primary px-8">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && previewUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="p-4 bg-white flex justify-center gap-4">
          <button onClick={handleRetake} className="btn-secondary">
            Opnieuw
          </button>
          <button onClick={handleConfirm} className="btn-success">
            Gebruiken
          </button>
        </div>
      </div>
    );
  }

  return null;
}
