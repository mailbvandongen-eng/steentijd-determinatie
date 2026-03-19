import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ADMIN_EMAILS } from '../lib/adminConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Check for redirect result (fallback login method)
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAdminError(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = user !== null && ADMIN_EMAILS.includes(user.email ?? '');

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      console.error('Firebase not configured');
      return;
    }

    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email ?? '';
      if (!ADMIN_EMAILS.includes(email)) {
        setAdminError('Je hebt geen docenttoegang');
        await firebaseSignOut(auth);
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      // If popup blocked, fallback to redirect
      if (firebaseError.code === 'auth/popup-blocked' ||
          firebaseError.code === 'auth/popup-closed-by-user') {
        console.log('Popup blocked, trying redirect...');
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error('Google sign in error:', error);
        throw error;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signOut }}>
      {adminError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <p className="text-red-600 font-medium text-center mb-4">{adminError}</p>
            <button
              onClick={() => setAdminError(null)}
              className="w-full py-2 bg-amber-500 text-white rounded-xl font-medium"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
