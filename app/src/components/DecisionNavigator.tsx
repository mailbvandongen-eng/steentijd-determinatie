import { useState, useEffect, type ChangeEvent } from 'react';
import { Sprout, Leaf, Star } from 'lucide-react';
import {
  getQuestion,
  processAnswer,
  formatTypeName,
  getTreeLabel,
  getTreeStartQuestionId,
  normalizeTreeResult,
  type DecisionTreeMode,
} from '../lib/decisionTree';
import { analyzeDetailImage, getHintForQuestion } from '../lib/aiAnalysis';
import { getSourceHint } from '../lib/sourceHints';
import type { DetailImage, DeterminationStep, UserLevel } from '../types';

interface DecisionNavigatorProps {
  imageUrl: string;
  detailImages?: DetailImage[];
  onDetailImagesChange?: (images: DetailImage[]) => void | Promise<void>;
  onStep: (step: DeterminationStep) => void;
  onComplete: (result: { type: string; description?: string; hintsUsed: number; sourceResultType?: string }) => void;
  onBack: () => void;
  level?: UserLevel;
  isSandbox?: boolean;
  treeMode?: DecisionTreeMode;
  startQuestionId?: string;
}

export function DecisionNavigator({
  imageUrl,
  detailImages = [],
  onDetailImagesChange,
  onStep,
  onComplete,
  onBack,
  level = 'beginner',
  isSandbox = false,
  treeMode = 'beginner',
  startQuestionId,
}: DecisionNavigatorProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState(() => startQuestionId ?? getTreeStartQuestionId(treeMode));
  const [history, setHistory] = useState<string[]>([]);
  const [forwardHistory, setForwardHistory] = useState<string[]>([]);
  const [answeredSteps, setAnsweredSteps] = useState<DeterminationStep[]>([]);
  const [forwardSteps, setForwardSteps] = useState<DeterminationStep[]>([]);
  const [stepCount, setStepCount] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<{ text: string; sourceLabel: string; sourceRef?: string; pitfall?: string } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [isAddingDetailImage, setIsAddingDetailImage] = useState(false);

  const question = getQuestion(currentQuestionId, treeMode);
  const treeLabel = getTreeLabel(treeMode);
  const isBeginnerTree = treeMode === 'beginner';
  const canAddDetailImages = level !== 'beginner';
  const showToelichtingDirectly = level === 'beginner' || !isBeginnerTree;

  useEffect(() => {
    setCurrentQuestionId(startQuestionId ?? getTreeStartQuestionId(treeMode));
    setHistory([]);
    setForwardHistory([]);
    setAnsweredSteps([]);
    setForwardSteps([]);
    setStepCount(1);
    setHintsUsed(0);
  }, [treeMode, startQuestionId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentHint(null);
    setHintError(null);
  }, [currentQuestionId]);

  const handleAnswer = (answer: 'ja' | 'nee') => {
    if (!question) return;

    const step: DeterminationStep = {
      questionId: currentQuestionId,
      questionText: question.vraag,
      answer,
      referenceImages: [],
      timestamp: new Date().toISOString(),
    };
    onStep(step);
    setAnsweredSteps((prev) => [...prev, step]);

    const result = processAnswer(currentQuestionId, answer, treeMode);
    setForwardHistory([]);
    setForwardSteps([]);

    if (result.isEnd && result.result) {
      const normalizedResult = normalizeTreeResult(treeMode, result.result);
      onComplete({
        type: normalizedResult,
        description: formatTypeName(normalizedResult),
        hintsUsed,
        sourceResultType: normalizedResult,
      });
      return;
    }

    if (result.nextQuestion) {
      setHistory((prev) => [...prev, currentQuestionId]);
      setCurrentQuestionId(result.nextQuestion);
      setStepCount((count) => count + 1);
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const previousQuestionId = history[history.length - 1];
      const previousStep = answeredSteps[answeredSteps.length - 1];
      setForwardHistory((prev) => [currentQuestionId, ...prev]);
      if (previousStep) {
        setForwardSteps((prev) => [previousStep, ...prev]);
      }
      setHistory((prev) => prev.slice(0, -1));
      setAnsweredSteps((prev) => prev.slice(0, -1));
      setCurrentQuestionId(previousQuestionId);
      setStepCount((count) => count - 1);
      return;
    }

    onBack();
  };

  const handleGoForward = () => {
    if (forwardHistory.length === 0) return;

    const nextQuestionId = forwardHistory[0];
    const nextStep = forwardSteps[0];
    setHistory((prev) => [...prev, currentQuestionId]);
    setForwardHistory((prev) => prev.slice(1));
    if (nextStep) {
      setAnsweredSteps((prev) => [...prev, nextStep]);
    }
    setForwardSteps((prev) => prev.slice(1));
    setCurrentQuestionId(nextQuestionId);
    setStepCount((count) => count + 1);
  };

  const handleRequestHint = async () => {
    if (isLoadingHint || !question) return;

    setIsLoadingHint(true);
    setHintError(null);
    setCurrentHint(null);

    try {
      const sourceHint = getSourceHint(currentQuestionId);
      if (sourceHint) {
        setCurrentHint({
          text: [sourceHint.short, sourceHint.detail].filter(Boolean).join(' '),
          sourceLabel: 'Bronhint',
          sourceRef: sourceHint.source,
          pitfall: sourceHint.pitfall,
        });
        setHintsUsed((prev) => prev + 1);
        return;
      }

      const result = await getHintForQuestion(imageUrl, question.vraag, currentQuestionId, question.toelichting);
      if (result.success && result.hint) {
        setCurrentHint({
          text: result.hint,
          sourceLabel: 'AI-hint',
        });
        setHintsUsed((prev) => prev + 1);
      } else {
        setHintError(result.error || 'Kon geen hint ophalen.');
      }
    } catch {
      setHintError('Er ging iets mis bij het ophalen van de hint.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleDetailImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onDetailImagesChange || !question || !canAddDetailImages) return;
    event.target.value = '';

    setIsAddingDetailImage(true);
    try {
      const detailImage = await new Promise<DetailImage>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = async () => {
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas niet beschikbaar'));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob | null>((resolveBlob) => {
            canvas.toBlob(resolveBlob, 'image/jpeg', 0.85);
          });

          const thumbCanvas = document.createElement('canvas');
          const thumbScale = Math.min(1, 500 / Math.max(img.width, img.height));
          thumbCanvas.width = Math.round(img.width * thumbScale);
          thumbCanvas.height = Math.round(img.height * thumbScale);
          const thumbCtx = thumbCanvas.getContext('2d');
          if (!thumbCtx || !blob) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Kon detailfoto niet verwerken'));
            return;
          }

          thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
          const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(objectUrl);

          resolve({
            id: crypto.randomUUID(),
            blob,
            thumbnail,
            createdAt: new Date().toISOString(),
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Kon detailfoto niet laden'));
        };
        img.src = objectUrl;
      });

      const analysis = await analyzeDetailImage(
        detailImage.thumbnail,
        currentQuestionId,
        question.vraag,
        question.toelichting
      );

      await onDetailImagesChange([
        ...detailImages,
        {
          ...detailImage,
          analysis: analysis.success && analysis.feedback
            ? {
                feedback: analysis.feedback,
                analyzedAt: new Date().toISOString(),
              }
            : undefined,
        },
      ]);
    } catch {
      setHintError('De detailfoto kon niet worden toegevoegd.');
    } finally {
      setIsAddingDetailImage(false);
    }
  };

  if (!question) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Vraag niet gevonden</p>
        <button onClick={handleGoBack} className="btn-secondary mt-4">
          Terug
        </button>
      </div>
    );
  }

  const levelConfig = {
    beginner: { icon: <Sprout className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400' },
    gevorderd: { icon: <Leaf className="w-4 h-4" />, color: 'bg-amber-500/20 text-amber-400' },
    expert: { icon: <Star className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400' },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-stone-50">
      <div className="bg-stone-800 p-3 flex items-center gap-3 shrink-0">
        <button onClick={handleGoBack} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src={imageUrl} alt="Artefact" className="w-10 h-10 rounded object-cover" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Stap {stepCount}</p>
          <p className="text-stone-400 text-xs">{history.length > 0 ? 'Terug = vorige vraag' : 'Terug = annuleren'}</p>
          {!isBeginnerTree && <p className="text-stone-400 text-xs">{treeLabel}</p>}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${levelConfig[level].color}`}>
          {levelConfig[level].icon}
          {isSandbox && <span className="opacity-70">Vrij</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="card mb-3">
          <p className="text-xs text-stone-500 mb-2 font-medium">JOUW ARTEFACT</p>
          <img
            src={imageUrl}
            alt="Jouw artefact"
            className="w-full max-h-56 object-contain rounded border border-stone-200"
          />
        </div>

        {detailImages.length > 0 && canAddDetailImages && (
          <div className="card mb-3">
            <p className="text-xs text-stone-500 mb-2 font-medium">DETAILFOTO&apos;S</p>
            <div className="space-y-3">
              {detailImages.map((image, index) => (
                <div key={image.id} className="rounded-xl border border-stone-200 p-2">
                  <img
                    src={image.thumbnail}
                    alt={`Detailfoto ${index + 1}`}
                    className="h-28 w-auto rounded border border-stone-200"
                  />
                  {image.analysis && (
                    <p className="mt-2 text-sm text-stone-700">{image.analysis.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-3">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">{question.vraag}</h2>
          {treeMode === 'expert' && (
            <p className="text-xs text-stone-500 mb-2">Bron: algoritme vraag {currentQuestionId}</p>
          )}
          {question.toelichting && showToelichtingDirectly && (
            <p className="text-sm text-stone-600 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
              {question.toelichting}
            </p>
          )}
        </div>

        {(currentHint || isLoadingHint || hintError) && (
          <div className="card mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">{currentHint?.sourceLabel ?? 'Hint'}</p>
            {isLoadingHint && <p className="text-sm text-blue-700">Hint wordt opgehaald...</p>}
            {hintError && <p className="text-sm text-red-600">{hintError}</p>}
            {currentHint && (
              <div className="space-y-2">
                <p className="text-sm text-blue-900">{currentHint.text}</p>
                {currentHint.pitfall && (
                  <p className="text-xs text-blue-700">Let op: {currentHint.pitfall}</p>
                )}
                {currentHint.sourceRef && (
                  <p className="text-xs text-blue-600">{currentHint.sourceRef}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-stone-200 shrink-0">
        <div className="flex justify-center gap-2 mb-3 flex-wrap">
          <button
            onClick={handleRequestHint}
            disabled={isLoadingHint}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLoadingHint
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {isLoadingHint ? 'Hint wordt opgehaald...' : 'Vraag hint'}
          </button>

          {canAddDetailImages && (
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              isAddingDetailImage
                ? 'bg-stone-100 text-stone-400'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={isAddingDetailImage}
                onChange={handleDetailImageSelected}
              />
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-2h6l2 2h4v12H3V7zm9 3a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
              {isAddingDetailImage ? 'Detailfoto wordt toegevoegd...' : 'Voeg detailfoto toe'}
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer('ja')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            Ja
          </button>
          <button
            onClick={() => handleAnswer('nee')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            Nee
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleGoBack}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {history.length > 0 ? 'Vorige stap' : 'Annuleren'}
          </button>
          {forwardHistory.length > 0 && (
            <button
              onClick={handleGoForward}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Volgende stap
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
