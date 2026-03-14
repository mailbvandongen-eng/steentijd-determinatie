// Training Session Service
// Gebruikt Firestore voor real-time sessies

import { firestore, auth } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

// Types
export interface TrainingSession {
  id: string;
  code: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  status: 'active' | 'closed';
  title?: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
  lastActive: Date;
  determinations: ParticipantDetermination[];
}

export interface ParticipantDetermination {
  id: string;
  imageUrl?: string;
  resultType: string;
  resultDescription?: string;
  steps: Array<{
    questionId: string;
    questionText: string;
    answer: 'ja' | 'nee';
  }>;
  hintsUsed: number;
  aiValidation?: {
    verdict: 'correct' | 'twijfelachtig' | 'onjuist';
    feedback: string;
  };
  docentValidation?: {
    approved: boolean;
    feedback?: string;
    validatedAt: Date;
  };
  completedAt: Date;
}

// Generate random session code (AWN-XXXX format)
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AWN-${code}`;
}

// Create a new training session (docent only)
export async function createTrainingSession(title?: string): Promise<TrainingSession | null> {
  if (!firestore || !auth?.currentUser) {
    console.error('Firebase not configured or user not logged in');
    return null;
  }

  const user = auth.currentUser;
  const code = generateSessionCode();
  const sessionId = code.toLowerCase();

  const session: Omit<TrainingSession, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    id: sessionId,
    code,
    createdBy: user.uid,
    createdByEmail: user.email || 'unknown',
    createdAt: serverTimestamp(),
    status: 'active',
    title: title || `Training ${new Date().toLocaleDateString('nl-NL')}`,
  };

  try {
    await setDoc(doc(firestore, 'trainingSessions', sessionId), session);
    return {
      ...session,
      createdAt: new Date(),
    } as TrainingSession;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Join a training session (student)
export async function joinTrainingSession(
  code: string,
  participantName: string
): Promise<{ session: TrainingSession; participantId: string } | null> {
  if (!firestore) {
    console.error('Firebase not configured');
    return null;
  }

  const sessionId = code.toLowerCase();

  try {
    const sessionDoc = await getDoc(doc(firestore, 'trainingSessions', sessionId));

    if (!sessionDoc.exists()) {
      console.error('Session not found');
      return null;
    }

    const sessionData = sessionDoc.data();
    if (sessionData.status !== 'active') {
      console.error('Session is closed');
      return null;
    }

    // Generate participant ID
    const participantId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add participant
    const participantData = {
      id: participantId,
      name: participantName,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      determinations: [],
    };

    await setDoc(
      doc(firestore, 'trainingSessions', sessionId, 'participants', participantId),
      participantData
    );

    return {
      session: {
        id: sessionData.id,
        code: sessionData.code,
        createdBy: sessionData.createdBy,
        createdByEmail: sessionData.createdByEmail,
        createdAt: sessionData.createdAt?.toDate() || new Date(),
        status: sessionData.status,
        title: sessionData.title,
      },
      participantId,
    };
  } catch (error) {
    console.error('Error joining session:', error);
    return null;
  }
}

// Submit a determination (student)
export async function submitDetermination(
  sessionCode: string,
  participantId: string,
  determination: Omit<ParticipantDetermination, 'id' | 'completedAt'>
): Promise<boolean> {
  if (!firestore) return false;

  const sessionId = sessionCode.toLowerCase();
  const determinationId = `${Date.now()}`;

  try {
    const participantRef = doc(
      firestore,
      'trainingSessions',
      sessionId,
      'participants',
      participantId
    );

    const participantDoc = await getDoc(participantRef);
    if (!participantDoc.exists()) return false;

    const currentData = participantDoc.data();
    const determinations = currentData.determinations || [];

    determinations.push({
      ...determination,
      id: determinationId,
      completedAt: new Date().toISOString(),
    });

    await updateDoc(participantRef, {
      determinations,
      lastActive: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error submitting determination:', error);
    return false;
  }
}

// Subscribe to session participants (docent - real-time)
export function subscribeToParticipants(
  sessionCode: string,
  callback: (participants: Participant[]) => void
): Unsubscribe | null {
  if (!firestore) return null;

  const sessionId = sessionCode.toLowerCase();
  const participantsRef = collection(
    firestore,
    'trainingSessions',
    sessionId,
    'participants'
  );

  return onSnapshot(participantsRef, (snapshot) => {
    const participants: Participant[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        joinedAt: data.joinedAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        determinations: data.determinations || [],
      };
    });
    callback(participants);
  });
}

// Get docent's sessions
export async function getDocentSessions(): Promise<TrainingSession[]> {
  if (!firestore || !auth?.currentUser) return [];

  try {
    const sessionsRef = collection(firestore, 'trainingSessions');
    const q = query(
      sessionsRef,
      where('createdBy', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        code: data.code,
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
        createdAt: data.createdAt?.toDate() || new Date(),
        status: data.status,
        title: data.title,
      };
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
}

// Close a session (docent)
export async function closeTrainingSession(sessionCode: string): Promise<boolean> {
  if (!firestore || !auth?.currentUser) return false;

  const sessionId = sessionCode.toLowerCase();

  try {
    const sessionRef = doc(firestore, 'trainingSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) return false;
    if (sessionDoc.data().createdBy !== auth.currentUser.uid) return false;

    await updateDoc(sessionRef, { status: 'closed' });
    return true;
  } catch (error) {
    console.error('Error closing session:', error);
    return false;
  }
}

// Validate a determination (docent)
export async function validateDeterminationAsDocent(
  sessionCode: string,
  participantId: string,
  determinationId: string,
  approved: boolean,
  feedback?: string
): Promise<boolean> {
  if (!firestore || !auth?.currentUser) return false;

  const sessionId = sessionCode.toLowerCase();

  try {
    const participantRef = doc(
      firestore,
      'trainingSessions',
      sessionId,
      'participants',
      participantId
    );

    const participantDoc = await getDoc(participantRef);
    if (!participantDoc.exists()) return false;

    const data = participantDoc.data();
    const determinations = data.determinations.map((d: ParticipantDetermination) => {
      if (d.id === determinationId) {
        return {
          ...d,
          docentValidation: {
            approved,
            feedback,
            validatedAt: new Date().toISOString(),
          },
        };
      }
      return d;
    });

    await updateDoc(participantRef, { determinations });
    return true;
  } catch (error) {
    console.error('Error validating determination:', error);
    return false;
  }
}

// Delete a session (docent)
export async function deleteTrainingSession(sessionCode: string): Promise<boolean> {
  if (!firestore || !auth?.currentUser) return false;

  const sessionId = sessionCode.toLowerCase();

  try {
    const sessionRef = doc(firestore, 'trainingSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) return false;
    if (sessionDoc.data().createdBy !== auth.currentUser.uid) return false;

    // Delete all participants first
    const participantsRef = collection(
      firestore,
      'trainingSessions',
      sessionId,
      'participants'
    );
    const participantsSnapshot = await getDocs(participantsRef);
    for (const participantDoc of participantsSnapshot.docs) {
      await deleteDoc(participantDoc.ref);
    }

    // Delete session
    await deleteDoc(sessionRef);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}
