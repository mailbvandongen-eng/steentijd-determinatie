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
    videoFrames?: LabeledImage[]; // Automatisch geëxtraheerde frames uit video
  }) => void;
}

const IMAGE_LABELS = [
  { key: 'dorsaal', label: 'Foto 1' },
  { key: 'ventraal', label: 'Foto 2' },
  { key: 'zijkant', label: 'Foto 3' },
  { key: 'extra', label: 'Foto 4' },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Comprimeer video tot onder MAX_FILE_SIZE
const compressVideo = async (file: File, onProgress?: (progress: number) => void): Promise<Blob> => {
  if (!file.type.startsWith('video/') || file.size <= MAX_FILE_SIZE) {
    return file;
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const width = Math.min(video.videoWidth, 1280); // Max 720p breedte
      const height = Math.round((width / video.videoWidth) * video.videoHeight);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      // Bereken target bitrate gebaseerd op gewenste bestandsgrootte
      // Target: 4MB voor veilige marge, minus audio (~64kbps)
      const targetSizeBits = 4 * 1024 * 1024 * 8;
      const audioBits = 64000 * duration;
      const videoBitrate = Math.max(500000, Math.floor((targetSizeBits - audioBits) / duration));

      const stream = canvas.captureStream(30);

      // Probeer audio toe te voegen als beschikbaar
      try {
        video.muted = false;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch {
        // Geen audio of niet ondersteund, ga door zonder
      }

      let recorder: MediaRecorder;
      const chunks: Blob[] = [];

      try {
        recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: videoBitrate,
        });
      } catch {
        try {
          recorder = new MediaRecorder(stream, {
            videoBitsPerSecond: videoBitrate,
          });
        } catch {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      recorder.start(100);

      // Speel video af en teken frames op canvas
      video.currentTime = 0;
      video.play();

      const drawFrame = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        if (onProgress) {
          onProgress(video.currentTime / duration);
        }
        requestAnimationFrame(drawFrame);
      };

      video.onplay = drawFrame;
      video.onended = () => recorder.stop();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
  });
};

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
  const [multiVideo, setMultiVideo] = useState<{ blob: Blob; thumbnail: string } | null>(null);
  const [currentLabel, setCurrentLabel] = useState<LabeledImage['label']>('dorsaal');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [addingVideoToMulti, setAddingVideoToMulti] = useState(false);
  const [isInMultiPhotoMode, setIsInMultiPhotoMode] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, size: 200 });
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);
  const photoCaptureRef = useRef<HTMLInputElement>(null);
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
    // Eerst mode veranderen zodat video element gerenderd wordt
    setMode(forVideo ? 'camera-video' : 'camera-photo');

    // Wacht een tick zodat React het video element kan renderen
    await new Promise(resolve => setTimeout(resolve, 100));

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
        // Wacht tot video geladen is en start afspelen
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
      setCameraError(`Kan camera niet openen: ${errorMessage}`);
      setMode('select');
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

    // Probeer verschillende codecs in volgorde van compatibiliteit
    // Let op: iOS ondersteunt alleen bepaalde formaten
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',              // VP8 - goede Android/Chrome support
      'video/webm;codecs=vp9,opus',              // VP9 - nieuwere browsers
      'video/webm',                               // Basis WebM
      'video/mp4',                                // MP4 fallback
    ];

    let recorder: MediaRecorder | null = null;
    let selectedMimeType = '';

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        try {
          recorder = new MediaRecorder(streamRef.current, { mimeType });
          selectedMimeType = mimeType;
          console.log('Using mimeType:', mimeType);
          break;
        } catch {
          continue;
        }
      }
    }

    // Laatste fallback: geen specifieke mimeType
    if (!recorder) {
      try {
        recorder = new MediaRecorder(streamRef.current);
        selectedMimeType = recorder.mimeType || 'video/webm';
        console.log('Using default mimeType:', selectedMimeType);
      } catch (err) {
        console.error('MediaRecorder not supported:', err);
        setCameraError('Video opname niet ondersteund op dit apparaat');
        stopCamera();
        setMode('select');
        return;
      }
    }

    mediaRecorderRef.current = recorder;

    mediaRecorderRef.current.ondataavailable = (e) => {
      console.log('Data available:', e.data.size, 'bytes');
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      setCameraError('Fout bij video opname');
      stopCamera();
      setMode('select');
    };

    mediaRecorderRef.current.onstop = async () => {
      console.log('Recording stopped, chunks:', chunksRef.current.length);

      // Controleer of er data is
      if (chunksRef.current.length === 0) {
        console.error('Geen video data opgenomen');
        setCameraError('Geen video data opgenomen. Probeer opnieuw.');
        setMode('select');
        return;
      }

      // Bereken totale grootte
      const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log('Total video size:', totalSize, 'bytes');

      if (totalSize === 0) {
        console.error('Video data is leeg');
        setCameraError('Video data is leeg. Probeer opnieuw.');
        setMode('select');
        return;
      }

      // Gebruik de mimeType van de recorder
      const mimeType = selectedMimeType || mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      console.log('Created blob:', blob.size, 'bytes, type:', blob.type);

      // Als we video toevoegen aan multi-photo, sla op en ga terug
      if (addingVideoToMulti) {
        const videoUrl = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error('Video load failed'));
          video.load();
          setTimeout(() => resolve(), 3000); // Timeout fallback
        });
        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
          setTimeout(() => resolve(), 1000); // Timeout fallback
        });
        const thumbnail = await createThumbnail(video);
        URL.revokeObjectURL(videoUrl);

        setMultiVideo({ blob, thumbnail });
        setAddingVideoToMulti(false);
        stopCamera();
        setMode('multi-photo');
      } else {
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setMode('preview-video');
        stopCamera();
      }
    };

    // Start met grotere timeslice voor betere compatibiliteit
    mediaRecorderRef.current.start(1000);
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
      // Request remaining data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
      }
      // Small delay to ensure data is collected
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 100);
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input zodat dezelfde file opnieuw geselecteerd kan worden
    e.target.value = '';

    if (isVideo) {
      let videoBlob: Blob = file;

      // Comprimeer video als deze te groot is
      if (file.size > MAX_FILE_SIZE) {
        setIsCompressing(true);
        setCompressProgress(0);
        try {
          videoBlob = await compressVideo(file, (progress) => {
            setCompressProgress(progress);
          });
        } catch (err) {
          console.error('Video compression failed:', err);
        }
        setIsCompressing(false);
      }

      // Stel blob en preview in
      const url = URL.createObjectURL(videoBlob);
      setCapturedBlob(videoBlob);
      setPreviewUrl(url);
      setMode('preview-video');
    } else {
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
    }
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

  const handleConfirmMulti = useCallback(async () => {
    if (multiImages.length === 0 && !multiVideo) return;

    let videoFrames: LabeledImage[] | undefined;

    // Extract frames uit video als die er is
    if (multiVideo) {
      videoFrames = await extractVideoFrames(multiVideo.blob);
    }

    // Gebruik eerste foto of video thumbnail als hoofdthumbnail
    const thumbnail = multiImages[0]?.thumbnail || multiVideo?.thumbnail || '';

    // Reset multi-photo mode
    setIsInMultiPhotoMode(false);

    onCapture({
      type: 'multi-photo',
      images: multiImages,
      videoBlob: multiVideo?.blob,
      videoFrames,
      thumbnail,
    });
  }, [multiImages, multiVideo, onCapture]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract frames uit video voor AI analyse (begin, midden, eind)
  const extractVideoFrames = async (videoBlob: Blob): Promise<LabeledImage[]> => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
      video.load();
    });

    const duration = video.duration;
    const frames: LabeledImage[] = [];
    const timePoints = [0.1, duration / 2, duration - 0.1]; // Begin, midden, eind
    const labels: Array<'dorsaal' | 'ventraal' | 'zijkant'> = ['dorsaal', 'ventraal', 'zijkant'];

    for (let i = 0; i < timePoints.length; i++) {
      video.currentTime = Math.max(0, Math.min(timePoints[i], duration));

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });

      if (blob) {
        const thumbnail = await createThumbnail(video);
        frames.push({
          label: labels[i],
          blob,
          thumbnail,
        });
      }
    }

    URL.revokeObjectURL(video.src);
    return frames;
  };

  // Compressie loading scherm
  if (isCompressing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-semibold text-center">Bestand verkleinen...</h2>
        <p className="text-stone-600 text-sm text-center">
          Het bestand is groter dan 5 MB en wordt gecomprimeerd
        </p>
        {compressProgress > 0 && (
          <div className="w-full max-w-xs">
            <div className="bg-stone-200 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(compressProgress * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs text-stone-500 mt-1">
              {Math.round(compressProgress * 100)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // Selectiescherm
  if (mode === 'select') {
    return (
      <div className="h-full flex flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            onClick={() => {
              setIsInMultiPhotoMode(true);
              setMode('multi-photo');
            }}
            className="w-full btn-primary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m3-3H9" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Meerdere foto's</div>
              <div className="text-xs opacity-80">Voeg meerdere foto's toe</div>
            </div>
          </button>

          {/* Enkele foto - gebruik native camera */}
          <button
            onClick={() => photoCaptureRef.current?.click()}
            className="w-full btn-secondary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Enkele foto</div>
              <div className="text-xs opacity-80">Opent camera voor foto</div>
            </div>
          </button>
          <input
            ref={photoCaptureRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e, false)}
            className="hidden"
          />

          {/* Video - gebruik native camera capture */}
          <button
            onClick={() => videoCaptureRef.current?.click()}
            className="w-full btn-secondary flex items-center gap-3 py-4"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <div className="font-semibold">Video opnemen</div>
              <div className="text-xs opacity-80">Opent camera voor video</div>
            </div>
          </button>
          <input
            ref={videoCaptureRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e, true)}
            className="hidden"
          />

          {/* Upload sectie */}
          <div className="border-t border-stone-200 pt-3 mt-1">
            <p className="text-xs text-stone-500 mb-2 font-medium">OF UPLOAD BESTAAND BESTAND</p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Foto
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, false)}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, true)}
                className="hidden"
              />
            </div>
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
          <p className="text-stone-400 text-xs">Tik op een vakje om een foto te maken</p>
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

          {/* Video sectie */}
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-2 font-medium">VIDEO (OPTIONEEL)</p>
            {multiVideo ? (
              <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
                <img src={multiVideo.thumbnail} alt="Video" className="w-full h-24 object-cover" />
                <button
                  onClick={() => setMultiVideo(null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Video opgenomen
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingVideoToMulti(true);
                  startCamera(true);
                }}
                className="w-full border-2 border-dashed border-stone-300 rounded-lg p-4 flex items-center justify-center gap-2 text-stone-400 hover:bg-stone-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Video toevoegen</span>
              </button>
            )}
            <p className="text-xs text-stone-400 mt-1 text-center">
              AI haalt automatisch frames uit de video
            </p>
          </div>

          <p className="text-xs text-stone-500 text-center">
            Minimaal 1 foto of video nodig. Meer = betere determinatie.
          </p>
        </div>

        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-stone-200 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setMultiImages([]);
              setMultiVideo(null);
              setIsInMultiPhotoMode(false);
              setMode('select');
            }}
            className="btn-secondary flex-1"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirmMulti}
            disabled={multiImages.length === 0 && !multiVideo}
            className="btn-success flex-1 disabled:opacity-50"
          >
            Doorgaan ({multiImages.length} foto's{multiVideo ? ' + video' : ''})
          </button>
        </div>
      </div>
    );
  }

  // Camera modus (foto)
  if (mode === 'camera-photo') {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-black">
        <div className="flex-1 min-h-0 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Label indicator */}
          {currentLabel && multiImages.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              {IMAGE_LABELS.find((l) => l.key === currentLabel)?.label}
            </div>
          )}
        </div>
        {/* Professional camera controls */}
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            {/* Cancel button - links */}
            <button
              onClick={() => {
                stopCamera();
                setMode(multiImages.length > 0 ? 'multi-photo' : 'select');
              }}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Shutter button - midden */}
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-lg active:scale-95 transition-transform"
            >
              <span className="sr-only">Foto maken</span>
            </button>
            {/* Placeholder voor symmetrie */}
            <div className="w-12 h-12" />
          </div>
        </div>
      </div>
    );
  }

  // Camera modus (video)
  if (mode === 'camera-video' || mode === 'recording') {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-black">
        <div className="flex-1 min-h-0 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600/90 text-white px-4 py-1.5 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        {/* Professional video controls */}
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            {/* Cancel button - links */}
            <button
              onClick={() => {
                if (isRecording) stopRecording();
                stopCamera();
                setMode('select');
              }}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Record/Stop button - midden */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/30 shadow-lg active:scale-95 transition-transform flex items-center justify-center"
              >
                <span className="w-6 h-6 bg-white rounded-full" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-600 border-4 border-red-400/50 shadow-lg active:scale-95 transition-transform flex items-center justify-center animate-pulse"
              >
                <span className="w-6 h-6 bg-white rounded-sm" />
              </button>
            )}
            {/* Placeholder voor symmetrie */}
            <div className="w-12 h-12" />
          </div>
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
            <div className="flex gap-2">
              <button onClick={handleRetake} className="btn-secondary flex-1">
                Opnieuw
              </button>
              <button onClick={initCrop} className="btn-secondary flex-1">
                Bijsnijden
              </button>
              <button onClick={handleAddToMulti} className="btn-success flex-1">
                Toevoegen
              </button>
            </div>
          ) : (
            // Enkele foto - kan gebruiken
            <div className="flex gap-2">
              <button onClick={handleRetake} className="btn-secondary flex-1">
                Opnieuw
              </button>
              <button onClick={initCrop} className="btn-secondary flex-1">
                Bijsnijden
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
            autoPlay
            playsInline
            className="max-h-full max-w-full"
          />
        </div>
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white flex gap-2 shrink-0">
          <button onClick={handleRetake} className="btn-secondary flex-1">
            Opnieuw
          </button>
          <button
            onClick={handleConfirmSingle}
            disabled={!capturedBlob}
            className="btn-success flex-1 disabled:opacity-50"
          >
            Gebruiken
          </button>
        </div>
      </div>
    );
  }

  return null;
}
