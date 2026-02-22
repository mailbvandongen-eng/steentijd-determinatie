import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from './firebase';
import {
  getUnsyncedSessions,
  markSessionSynced,
  addSessionFromCloud,
  getAllSessions,
  getUnsyncedLocations,
  markLocationSynced,
  addLocationFromCloud,
  getAllLocations,
  resetAllSyncStatus,
} from './db';
import type { DeterminationSession, SavedLocation } from '../types';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  errors: string[];
}

// Helper: upload thumbnail to Firebase Storage
async function uploadThumbnail(userId: string, sessionId: number, thumbnail: string): Promise<string | null> {
  if (!storage || !thumbnail) return null;

  try {
    const storageRef = ref(storage, `thumbnails/${userId}/${sessionId}.jpg`);
    // thumbnail is a data URL like "data:image/jpeg;base64,..."
    await uploadString(storageRef, thumbnail, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.error('Thumbnail upload failed:', err);
    return null;
  }
}

// Helper: upload drawing to Firebase Storage
async function uploadDrawing(userId: string, sessionId: number, imageIndex: number, drawing: string): Promise<string | null> {
  if (!storage || !drawing) return null;

  try {
    const storageRef = ref(storage, `drawings/${userId}/${sessionId}_${imageIndex}.png`);
    await uploadString(storageRef, drawing, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err) {
    console.error('Drawing upload failed:', err);
    return null;
  }
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

      // Upload thumbnail to Storage if available
      let thumbnailUrl: string | null = null;
      if (session.input.thumbnail) {
        thumbnailUrl = await uploadThumbnail(userId, session.id!, session.input.thumbnail);
      }

      // Upload drawings if available
      const drawingUrls: (string | null)[] = [];
      if (session.input.images) {
        for (let i = 0; i < session.input.images.length; i++) {
          const img = session.input.images[i];
          if (img.drawing) {
            const url = await uploadDrawing(userId, session.id!, i, img.drawing);
            drawingUrls.push(url);
          } else {
            drawingUrls.push(null);
          }
        }
      }

      // Prepare data for Firestore
      const sessionData = {
        userId,
        localId: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: session.status,
        inputType: session.input.type,
        thumbnailUrl, // URL to Firebase Storage
        drawingUrls, // URLs to Firebase Storage
        locatie: session.input.locatie || null,
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

// Helper: download image from URL and convert to data URL
async function downloadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Image download failed:', err);
    return null;
  }
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

        // Check if we have this exact session locally (same createdAt = same session)
        // Don't match on localId - that's just auto-increment and differs per device!
        const existingLocal = localSessions.find(s =>
          s.createdAt === data.createdAt && !s.cloudId
        );

        if (existingLocal) {
          // Link existing local session to cloud (same session from this device)
          await markSessionSynced(existingLocal.id!, cloudId);
          continue;
        }

        // Download thumbnail from Storage if available
        let thumbnail: string | undefined;
        if (data.thumbnailUrl) {
          const dataUrl = await downloadImageAsDataUrl(data.thumbnailUrl);
          if (dataUrl) thumbnail = dataUrl;
        }

        // Download drawings from Storage if available
        const drawingUrls = data.drawingUrls as (string | null)[] | undefined;
        const images: DeterminationSession['input']['images'] = [];

        if (drawingUrls && drawingUrls.length > 0) {
          for (let i = 0; i < drawingUrls.length; i++) {
            const drawingUrl = drawingUrls[i];
            let drawing: string | undefined;
            if (drawingUrl) {
              const dataUrl = await downloadImageAsDataUrl(drawingUrl);
              if (dataUrl) drawing = dataUrl;
            }
            // Create image entry with drawing (thumbnail will be shared)
            images.push({
              label: ['dorsaal', 'ventraal', 'zijkant', 'extra'][i] as 'dorsaal' | 'ventraal' | 'zijkant' | 'extra',
              blob: new Blob(), // Blob not synced
              thumbnail: thumbnail || '',
              drawing,
            });
          }
        }

        // Create new local session from cloud data
        const newSession: Omit<DeterminationSession, 'id'> = {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status,
          input: {
            type: data.inputType,
            thumbnail,
            images: images.length > 0 ? images : undefined,
            locatie: data.locatie || undefined,
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

        // Match on createdAt timestamp, not localId (localId differs per device)
        const existingLocal = localLocations.find(l =>
          l.createdAt === data.createdAt && !l.cloudId
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

// Force sync: reset all sync status and re-upload everything
export async function forceSyncAll(userId: string): Promise<SyncResult & { reset: { sessions: number; locations: number } }> {
  if (!firestore) {
    return {
      uploaded: 0,
      downloaded: 0,
      errors: ['Firebase niet geconfigureerd'],
      reset: { sessions: 0, locations: 0 },
    };
  }

  // First reset all sync status
  const reset = await resetAllSyncStatus();

  // Then do a normal sync (all items will be re-uploaded)
  const syncResult = await syncSessions(userId);

  return {
    ...syncResult,
    reset,
  };
}
