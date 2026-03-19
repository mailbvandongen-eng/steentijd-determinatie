import type { UserLevel } from '../types';

interface LevelSelectorProps {
  currentLevel: UserLevel;
  unlockedLevels: UserLevel[];
  onSelectLevel: (level: UserLevel) => void;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  beginner: {
    icon: '🌱',
    label: 'Beginner',
    description: 'Leer met hints en hulp',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    textColor: 'text-green-700',
  },
  gevorderd: {
    icon: '🌿',
    label: 'Gevorderd',
    description: 'Zelfstandig determineren',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
  },
  expert: {
    icon: '🌳',
    label: 'Expert',
    description: 'Binnenkort beschikbaar',
    color: 'from-purple-400 to-indigo-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-700',
  },
} as const;

export function LevelSelector({
  currentLevel,
  unlockedLevels,
  onSelectLevel,
  compact = false,
}: LevelSelectorProps) {
  const levels: UserLevel[] = ['beginner', 'gevorderd', 'expert'];

  if (compact) {
    // Compact versie voor in header
    const config = LEVEL_CONFIG[currentLevel];
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
        <span className="text-sm">{config.icon}</span>
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-600 uppercase tracking-wide">
        Kies je niveau
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((level) => {
          const config = LEVEL_CONFIG[level];
          const isUnlocked = unlockedLevels.includes(level);
          const isSelected = currentLevel === level;
          const isExpert = level === 'expert';

          return (
            <button
              key={level}
              onClick={() => isUnlocked && !isExpert && onSelectLevel(level)}
              disabled={!isUnlocked || isExpert}
              className={`
                relative p-3 rounded-xl transition-all
                ${isSelected
                  ? `bg-gradient-to-br ${config.color} text-white shadow-lg scale-105`
                  : isUnlocked && !isExpert
                    ? `${config.bgColor} ${config.textColor} hover:scale-102 border-2 ${config.borderColor}`
                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                }
              `}
            >
              {/* Lock icon for locked levels */}
              {(!isUnlocked || isExpert) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-stone-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}

              {/* Checkmark for selected */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="text-center">
                <span className="text-2xl block mb-1">{config.icon}</span>
                <span className="text-xs font-medium block">{config.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
