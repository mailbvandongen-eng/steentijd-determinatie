interface ProgressBarProps {
  correctProgress: number; // 0-100
  validationProgress: number; // 0-100
  totalCorrect: number;
  totalValidations: number;
  correctNeeded: number;
  validationsNeeded: number;
  isUnlocked: boolean;
}

export function ProgressBar({
  correctProgress,
  validationProgress,
  totalCorrect,
  totalValidations,
  correctNeeded,
  validationsNeeded,
  isUnlocked,
}: ProgressBarProps) {
  const overallProgress = Math.round((correctProgress + validationProgress) / 2);

  if (isUnlocked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <div className="flex items-center gap-2 text-green-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Gevorderd niveau ontgrendeld!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-600">
          Voortgang naar Gevorderd
        </span>
        <span className="text-sm font-bold text-amber-600">
          {overallProgress}%
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Detailed progress */}
      <div className="grid grid-cols-2 gap-3">
        {/* Correct determinations */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Correct</span>
            <span className="font-medium text-stone-700">{totalCorrect}/20</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${correctProgress}%` }}
            />
          </div>
          {correctNeeded > 0 && (
            <p className="text-xs text-stone-400">nog {correctNeeded}</p>
          )}
        </div>

        {/* Docent validations */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Validaties</span>
            <span className="font-medium text-stone-700">{totalValidations}/5</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${validationProgress}%` }}
            />
          </div>
          {validationsNeeded > 0 && (
            <p className="text-xs text-stone-400">nog {validationsNeeded}</p>
          )}
        </div>
      </div>
    </div>
  );
}
