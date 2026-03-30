import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserProfile, UserLevel } from '../types';
import {
  getUserProfile,
  saveUserProfile,
  selectLevel,
  recordDetermination,
  recordDocentValidation,
  promoteToLevel,
  getProgressToGevorderd,
  getProgressToExpert,
  isLevelUnlocked,
  UNLOCK_CRITERIA,
} from '../lib/userProfile';

interface UserContextType {
  profile: UserProfile;

  // Niveau management
  currentLevel: UserLevel;
  setCurrentLevel: (level: UserLevel) => void;
  isLevelUnlocked: (level: UserLevel) => boolean;

  // Progressie
  progress: ReturnType<typeof getProgressToGevorderd>;
  progressToExpert: ReturnType<typeof getProgressToExpert>;

  // Acties
  recordResult: (
    wasCorrect: boolean,
    hintsUsed: number,
    durationMs: number,
    category?: string,
    isSandbox?: boolean
  ) => void;
  addDocentValidation: () => void;
  promoteUser: (level: UserLevel) => void;

  // Constanten
  unlockCriteria: typeof UNLOCK_CRITERIA;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());

  // Niveau selecteren
  const setCurrentLevel = useCallback((level: UserLevel) => {
    setProfile((prev) => {
      const updated = selectLevel(prev, level);
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Check of niveau unlocked is
  const checkLevelUnlocked = useCallback(
    (level: UserLevel) => isLevelUnlocked(profile, level),
    [profile]
  );

  // Bereken progressie
  const progress = getProgressToGevorderd(profile);
  const progressToExpert = getProgressToExpert(profile);

  // Registreer determinatie resultaat
  const recordResult = useCallback(
    (
      wasCorrect: boolean,
      hintsUsed: number,
      durationMs: number,
      category?: string,
      isSandbox?: boolean
    ) => {
      setProfile((prev) => {
        const updated = recordDetermination(
          prev,
          prev.currentLevel,
          wasCorrect,
          hintsUsed,
          durationMs,
          category,
          isSandbox
        );
        saveUserProfile(updated);
        return updated;
      });
    },
    []
  );

  // Registreer docent validatie
  const addDocentValidation = useCallback(() => {
    setProfile((prev) => {
      const updated = recordDocentValidation(prev, true);
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Promoveer gebruiker (door docent)
  const promoteUser = useCallback((level: UserLevel) => {
    setProfile((prev) => {
      const updated = promoteToLevel(prev, level);
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        currentLevel: profile.currentLevel,
        setCurrentLevel,
        isLevelUnlocked: checkLevelUnlocked,
        progress,
        progressToExpert,
        recordResult,
        addDocentValidation,
        promoteUser,
        unlockCriteria: UNLOCK_CRITERIA,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
