interface ProgressBarProps {
  correctProgress: number; // 0-100
  validationProgress: number; // 0-100
  totalCorrect: number;
  totalValidations: number;
  correctNeeded: number;
  validationsNeeded: number;
  isUnlocked: boolean;
  targetLevel?: 'gevorderd' | 'expert';
  correctTarget?: number;
  validationTarget?: number;
}

export function ProgressBar({
  correctProgress,
  validationProgress,
  totalCorrect,
  totalValidations,
  correctNeeded,
  validationsNeeded,
  isUnlocked,
  targetLevel = 'gevorderd',
  correctTarget = 20,
  validationTarget = 5,
}: ProgressBarProps) {
  const overallProgress = Math.round((correctProgress + validationProgress) / 2);

  const targetLabel = targetLevel === 'expert' ? 'Expert' : 'Gevorderd';
  const unlockedColor = targetLevel === 'expert' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-green-50 border-green-200 text-green-700';
  const barColor = targetLevel === 'expert'
    ? 'bg-gradient-to-r from-purple-400 to-violet-500'
    : 'bg-gradient-to-r from-amber-400 to-orange-500';
  const barProgressColor = targetLevel === 'expert' ? 'bg-purple-500' : 'bg-emerald-500';
  const barValidationColor = targetLevel === 'expert' ? 'bg-violet-500' : 'bg-blue-500';
  const percentColor = targetLevel === 'expert' ? 'text-purple-600' : 'text-amber-600';

  if (isUnlocked) {
    return (
      <div className={`border rounded-xl p-3 ${unlockedColor}`}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{targetLabel} niveau ontgrendeld!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-600">
          Voortgang naar {targetLabel}
        </span>
        <span className={`text-sm font-bold ${percentColor}`}>
          {overallProgress}%
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Detailed progress */}
      <div className="grid grid-cols-2 gap-3">
        {/* Correct determinations */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">Correct</span>
            <span className="font-medium text-stone-700">{totalCorrect}/{correctTarget}</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barProgressColor} rounded-full transition-all`}
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
            <span className="font-medium text-stone-700">{totalValidations}/{validationTarget}</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barValidationColor} rounded-full transition-all`}
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
