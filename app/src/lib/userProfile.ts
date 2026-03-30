// User Profile Service
// Beheert gebruikersprogressie in localStorage

import type { UserProfile, UserLevel, LevelStats } from '../types';

const STORAGE_KEY = 'steentijd_user_profile';

// Unlock criteria
export const UNLOCK_CRITERIA = {
  gevorderd: {
    correctDeterminations: 20,
    docentValidations: 5,
  },
  expert: {
    correctDeterminations: 30, // Op gevorderd niveau
    docentValidations: 10,
  },
} as const;

// Maak een lege LevelStats
function createEmptyLevelStats(): LevelStats {
  return {
    attempts: 0,
    correct: 0,
    hintsUsed: 0,
    averageTime: 0,
    lastPlayed: null,
  };
}

// Maak een nieuw profiel
function createNewProfile(): UserProfile {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currentLevel: 'beginner',
    unlockedLevels: ['beginner'],
    totalCorrect: 0,
    totalAttempts: 0,
    docentValidations: 0,
    stats: {
      beginner: createEmptyLevelStats(),
      gevorderd: createEmptyLevelStats(),
      expert: createEmptyLevelStats(),
    },
    categoryScores: {},
  };
}

// Haal profiel op uit localStorage
export function getUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      // Migratie: voeg ontbrekende velden toe
      if (!profile.stats) {
        profile.stats = {
          beginner: createEmptyLevelStats(),
          gevorderd: createEmptyLevelStats(),
          expert: createEmptyLevelStats(),
        };
      }
      if (!profile.categoryScores) {
        profile.categoryScores = {};
      }
      if (profile.unlockedLevels === undefined) {
        profile.unlockedLevels = ['beginner'];
      }
      return profile;
    }
  } catch (error) {
    console.error('Error reading user profile:', error);
  }
  return createNewProfile();
}

// Sla profiel op
export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

// Check of een niveau unlocked is
export function isLevelUnlocked(profile: UserProfile, level: UserLevel): boolean {
  return profile.unlockedLevels.includes(level);
}

// Check of gevorderd niveau bereikt kan worden
export function canUnlockGevorderd(profile: UserProfile): boolean {
  const criteria = UNLOCK_CRITERIA.gevorderd;
  return (
    profile.totalCorrect >= criteria.correctDeterminations &&
    profile.docentValidations >= criteria.docentValidations
  );
}

// Unlock gevorderd niveau (als criteria bereikt)
export function tryUnlockGevorderd(profile: UserProfile): UserProfile {
  if (!profile.unlockedLevels.includes('gevorderd') && canUnlockGevorderd(profile)) {
    return {
      ...profile,
      unlockedLevels: [...profile.unlockedLevels, 'gevorderd'],
    };
  }
  return profile;
}

// Check of expert niveau bereikt kan worden
export function canUnlockExpert(profile: UserProfile): boolean {
  if (!profile.unlockedLevels.includes('gevorderd')) return false;
  const criteria = UNLOCK_CRITERIA.expert;
  return (
    profile.totalCorrect >= criteria.correctDeterminations &&
    profile.docentValidations >= criteria.docentValidations
  );
}

// Unlock expert niveau (als criteria bereikt)
export function tryUnlockExpert(profile: UserProfile): UserProfile {
  if (!profile.unlockedLevels.includes('expert') && canUnlockExpert(profile)) {
    return {
      ...profile,
      unlockedLevels: [...profile.unlockedLevels, 'expert'],
    };
  }
  return profile;
}

// Bereken voortgang naar expert (0-100%)
export function getProgressToExpert(profile: UserProfile): {
  percentage: number;
  correctProgress: number;
  validationProgress: number;
  correctNeeded: number;
  validationsNeeded: number;
} {
  const criteria = UNLOCK_CRITERIA.expert;

  const correctProgress = Math.min(profile.totalCorrect / criteria.correctDeterminations, 1);
  const validationProgress = Math.min(profile.docentValidations / criteria.docentValidations, 1);

  const percentage = Math.round(((correctProgress + validationProgress) / 2) * 100);

  return {
    percentage,
    correctProgress: Math.round(correctProgress * 100),
    validationProgress: Math.round(validationProgress * 100),
    correctNeeded: Math.max(0, criteria.correctDeterminations - profile.totalCorrect),
    validationsNeeded: Math.max(0, criteria.docentValidations - profile.docentValidations),
  };
}

// Handmatig promoveren (door docent)
export function promoteToLevel(profile: UserProfile, level: UserLevel): UserProfile {
  if (profile.unlockedLevels.includes(level)) {
    return profile;
  }

  const newUnlocked = [...profile.unlockedLevels];

  // Unlock ook tussenliggende niveaus
  if (level === 'gevorderd' && !newUnlocked.includes('gevorderd')) {
    newUnlocked.push('gevorderd');
  }
  if (level === 'expert') {
    if (!newUnlocked.includes('gevorderd')) newUnlocked.push('gevorderd');
    if (!newUnlocked.includes('expert')) newUnlocked.push('expert');
  }

  return {
    ...profile,
    unlockedLevels: newUnlocked,
    currentLevel: level,
  };
}

// Selecteer een niveau (als unlocked)
export function selectLevel(profile: UserProfile, level: UserLevel): UserProfile {
  if (!profile.unlockedLevels.includes(level)) {
    return profile;
  }
  return {
    ...profile,
    currentLevel: level,
  };
}

// Registreer een voltooide determinatie
export function recordDetermination(
  profile: UserProfile,
  level: UserLevel,
  wasCorrect: boolean,
  hintsUsed: number,
  durationMs: number,
  category?: string,
  isSandbox?: boolean
): UserProfile {
  // Sandbox sessies tellen niet mee
  if (isSandbox) {
    return profile;
  }

  const updatedProfile = { ...profile };

  // Update totalen
  updatedProfile.totalAttempts += 1;
  if (wasCorrect) {
    updatedProfile.totalCorrect += 1;
  }

  // Update level stats
  const levelStats = { ...updatedProfile.stats[level] };
  levelStats.attempts += 1;
  if (wasCorrect) {
    levelStats.correct += 1;
  }
  levelStats.hintsUsed += hintsUsed;
  levelStats.lastPlayed = new Date().toISOString();

  // Gemiddelde tijd bijwerken
  if (levelStats.attempts === 1) {
    levelStats.averageTime = durationMs;
  } else {
    levelStats.averageTime = Math.round(
      (levelStats.averageTime * (levelStats.attempts - 1) + durationMs) / levelStats.attempts
    );
  }

  updatedProfile.stats = {
    ...updatedProfile.stats,
    [level]: levelStats,
  };

  // Category scores bijwerken
  if (category) {
    const categoryStats = updatedProfile.categoryScores[category] || { correct: 0, total: 0 };
    categoryStats.total += 1;
    if (wasCorrect) {
      categoryStats.correct += 1;
    }
    updatedProfile.categoryScores = {
      ...updatedProfile.categoryScores,
      [category]: categoryStats,
    };
  }

  // Check unlock gevorderd + expert
  const withGevorderd = tryUnlockGevorderd(updatedProfile);
  const finalProfile = tryUnlockExpert(withGevorderd);

  return finalProfile;
}

// Registreer een docent validatie
export function recordDocentValidation(profile: UserProfile, approved: boolean): UserProfile {
  if (!approved) {
    return profile;
  }

  const updatedProfile = {
    ...profile,
    docentValidations: profile.docentValidations + 1,
  };

  // Check unlock gevorderd + expert
  const withGevorderd = tryUnlockGevorderd(updatedProfile);
  return tryUnlockExpert(withGevorderd);
}

// Bereken voortgang naar gevorderd (0-100%)
export function getProgressToGevorderd(profile: UserProfile): {
  percentage: number;
  correctProgress: number;
  validationProgress: number;
  correctNeeded: number;
  validationsNeeded: number;
} {
  const criteria = UNLOCK_CRITERIA.gevorderd;

  const correctProgress = Math.min(profile.totalCorrect / criteria.correctDeterminations, 1);
  const validationProgress = Math.min(profile.docentValidations / criteria.docentValidations, 1);

  // Gewogen gemiddelde (beiden moeten 100% zijn)
  const percentage = Math.round(((correctProgress + validationProgress) / 2) * 100);

  return {
    percentage,
    correctProgress: Math.round(correctProgress * 100),
    validationProgress: Math.round(validationProgress * 100),
    correctNeeded: Math.max(0, criteria.correctDeterminations - profile.totalCorrect),
    validationsNeeded: Math.max(0, criteria.docentValidations - profile.docentValidations),
  };
}

// Reset profiel (voor testen)
export function resetProfile(): UserProfile {
  const newProfile = createNewProfile();
  saveUserProfile(newProfile);
  return newProfile;
}
