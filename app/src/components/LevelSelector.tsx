import { useState } from 'react';
import { Sprout, Leaf, TreePine, ChevronDown, Check } from 'lucide-react';
import type { UserLevel } from '../types';

interface LevelSelectorProps {
  currentLevel: UserLevel;
  unlockedLevels: UserLevel[];
  onSelectLevel: (level: UserLevel) => void;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  beginner: {
    Icon: Sprout,
    label: 'Beginner',
    description: 'Leer met hints en hulp',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
  },
  gevorderd: {
    Icon: Leaf,
    label: 'Gevorderd',
    description: 'Zelfstandig determineren',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-600',
  },
  expert: {
    Icon: TreePine,
    label: 'Expert',
    description: 'Binnenkort beschikbaar',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-700',
    iconColor: 'text-purple-600',
  },
} as const;

export function LevelSelector({
  currentLevel,
  unlockedLevels,
  onSelectLevel,
  compact = false,
}: LevelSelectorProps) {
  const [open, setOpen] = useState(false);

  const config = LEVEL_CONFIG[currentLevel];
  const CurrentIcon = config.Icon;

  // Only show selectable (unlocked, non-expert) levels in the dropdown
  const selectableLevels = (['beginner', 'gevorderd'] as UserLevel[]).filter(
    (l) => unlockedLevels.includes(l)
  );
  const canSwitch = selectableLevels.length > 1;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor}`}>
        <CurrentIcon size={14} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Badge / trigger button */}
      <button
        onClick={() => canSwitch && setOpen((o) => !o)}
        disabled={!canSwitch}
        className={`
          w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${canSwitch ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        `}
      >
        <CurrentIcon size={18} />
        <span className="font-semibold">{config.label}</span>
        <span className="text-xs opacity-70 flex-1 text-left">{config.description}</span>
        {canSwitch && (
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
          {selectableLevels.map((level) => {
            const cfg = LEVEL_CONFIG[level];
            const LevelIcon = cfg.Icon;
            const isSelected = currentLevel === level;
            return (
              <button
                key={level}
                onClick={() => { onSelectLevel(level); setOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${isSelected ? `${cfg.bgColor} ${cfg.textColor}` : 'hover:bg-stone-50 text-stone-700'}
                `}
              >
                <LevelIcon size={16} className={cfg.iconColor} />
                <span className="font-medium">{cfg.label}</span>
                <span className="text-xs text-stone-400 flex-1">{cfg.description}</span>
                {isSelected && <Check size={16} className={cfg.iconColor} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
