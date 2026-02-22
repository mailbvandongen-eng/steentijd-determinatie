import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';
import {
  getUnsyncedSessions,
  markSessionSynced,
  addSessionFromCloud,
  getAllSessions,
  getUnsyncedLocations,
  markLocationSynced,
  addLocationFromCloud,
  getAllLocations,
} from './db';
import type { DeterminationSession, SavedLocation } from '../types';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  errors: string[];
}

// Upload local sessions to Firestore
async function uploadSessions(userId: string): Promise<{ uploaded: number; errors: string[] }> {
  if (!firestore) throw new Error('Firebase not configured');

  const unsynced = await getUnsyncedSessions();
  let uploaded = 0;
  const errors: string[] = [];

  for (const session of unsynced) {
    try {
      // Create a unique document ID
      const docId = `${userId}_${session.id}`;

      // Prepare data for Firestore (no blobs - those stay local for now)
      const sessionData = {
        userId,
        localId: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: session.status,
        inputType: session.input.type,
        resultType: session.result?.type || null,
        resultPeriod: session.result?.period || null,
        resultConfidence: session.result?.confidence || null,
        resultCharacteristics: session.result?.characteristics || [],
        resultFullAnalysis: session.result?.fullAnalysis || null,
        resultDescription: session.result?.description || null,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'sessions', docId), sessionData);
      await markSessionSynced(session.id!, docId);
      uploaded++;
    } catch (err) {
      errors.push(`Fout bij sessie ${session.id}: ${err instanceof Error ? err.message : 'Onbekend'}`);
    }
  }

  return { uploaded, errors };
}

// Download sessions from Firestore
async function downloadSessions(userId: string): Promise<{ downloaded: number; errors: string[] }> {
  if (!firestore) throw new Error('Firebase not configured');

  let downloaded = 0;
  const errors: string[] = [];

  try {
    const sessionsRef = collection(firestore, 'sessions');
    const q = query(sessionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const localSessions = await getAllSessions();
    const localCloudIds = new Set(localSessions.filter(s => s.cloudId).map(s => s.cloudId));

    for (const docSnap of querySnapshot.docs) {
      const cloudId = docSnap.id;

      // Skip if already exists locally
      if (localCloudIds.has(cloudId)) {
        continue;
      }

      try {
        const data = docSnap.data();

        // Check if we have this session locally by localId (from same device)
        const existingLocal = localSessions.find(s =>
          s.id === data.localId && !s.cloudId
        );

        if (existingLocal) {
          // Link existing local session to cloud
          await markSessionSynced(existingLocal.id!, cloudId);
          continue;
        }

        // Create new local session from cloud data
        const newSession: Omit<DeterminationSession, 'id'> = {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status,
          input: {
            type: data.inputType,
            images: [], // Images are not synced yet
          },
          steps: [],
          result: data.resultType ? {
            type: data.resultType,
            period: data.resultPeriod,
            confidence: data.resultConfidence,
            characteristics: data.resultCharacteristics,
            fullAnalysis: data.resultFullAnalysis,
            description: data.resultDescription,
          } : undefined,
          synced: true,
          cloudId: cloudId,
          lastSyncedAt: new Date().toISOString(),
        };

        await addSessionFromCloud(newSession);
        downloaded++;
      } catch (err) {
        errors.push(`Fout bij downloaden: ${err instanceof Error ? err.message : 'Onbekend'}`);
      }
    }
  } catch (err) {
    errors.push(`Download fout: ${err instanceof Error ? err.message : 'Onbekend'}`);
  }

  return { downloaded, errors };
}

// ========== Location Sync ==========

// Upload local locations to Firestore
async function uploadLocations(userId: string): Promise<{ uploaded: number; errors: string[] }> {
  if (!firestore) throw new Error('Firebase not configured');

  const unsynced = await getUnsyncedLocations();
  let uploaded = 0;
  const errors: string[] = [];

  for (const location of unsynced) {
    try {
      const docId = `${userId}_loc_${location.id}`;

      const locationData = {
        userId,
        localId: location.id,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
        lat: location.lat,
        lng: location.lng,
        naam: location.naam || null,
        notitie: location.notitie || null,
        linkedSessionIds: location.linkedSessionIds || [],
        syncedAt: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'locations', docId), locationData);
      await markLocationSynced(location.id!, docId);
      uploaded++;
    } catch (err) {
      errors.push(`Fout bij locatie ${location.id}: ${err instanceof Error ? err.message : 'Onbekend'}`);
    }
  }

  return { uploaded, errors };
}

// Download locations from Firestore
async function downloadLocations(userId: string): Promise<{ downloaded: number; errors: string[] }> {
  if (!firestore) throw new Error('Firebase not configured');

  let downloaded = 0;
  const errors: string[] = [];

  try {
    const locationsRef = collection(firestore, 'locations');
    const q = query(locationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const localLocations = await getAllLocations();
    const localCloudIds = new Set(localLocations.filter(l => l.cloudId).map(l => l.cloudId));

    for (const docSnap of querySnapshot.docs) {
      const cloudId = docSnap.id;

      if (localCloudIds.has(cloudId)) {
        continue;
      }

      try {
        const data = docSnap.data();

        const existingLocal = localLocations.find(l =>
          l.id === data.localId && !l.cloudId
        );

        if (existingLocal) {
          await markLocationSynced(existingLocal.id!, cloudId);
          continue;
        }

        const newLocation: Omit<SavedLocation, 'id'> = {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lat: data.lat,
          lng: data.lng,
          naam: data.naam,
          notitie: data.notitie,
          linkedSessionIds: data.linkedSessionIds || [],
          cloudId: cloudId,
          lastSyncedAt: new Date().toISOString(),
        };

        await addLocationFromCloud(newLocation);
        downloaded++;
      } catch (err) {
        errors.push(`Fout bij downloaden locatie: ${err instanceof Error ? err.message : 'Onbekend'}`);
      }
    }
  } catch (err) {
    errors.push(`Download locaties fout: ${err instanceof Error ? err.message : 'Onbekend'}`);
  }

  return { downloaded, errors };
}

// Main sync function (sessions + locations)
export async function syncSessions(userId: string): Promise<SyncResult> {
  if (!firestore) {
    return {
      uploaded: 0,
      downloaded: 0,
      errors: ['Firebase niet geconfigureerd'],
    };
  }

  // Sync sessions
  const sessionUpload = await uploadSessions(userId);
  const sessionDownload = await downloadSessions(userId);

  // Sync locations
  const locationUpload = await uploadLocations(userId);
  const locationDownload = await downloadLocations(userId);

  return {
    uploaded: sessionUpload.uploaded + locationUpload.uploaded,
    downloaded: sessionDownload.downloaded + locationDownload.downloaded,
    errors: [
      ...sessionUpload.errors,
      ...sessionDownload.errors,
      ...locationUpload.errors,
      ...locationDownload.errors,
    ],
  };
}
