import Dexie, { type EntityTable } from 'dexie';
import type { DeterminationSession, SavedLocation } from '../types';

// Database definitie
const db = new Dexie('SteentijdDB') as Dexie & {
  sessions: EntityTable<DeterminationSession, 'id'>;
  images: EntityTable<{ id?: number; name: string; blob: Blob }, 'id'>;
  locations: EntityTable<SavedLocation, 'id'>;
};

db.version(1).stores({
  sessions: '++id, createdAt, status, synced',
  images: '++id, name',
});

// Version 2: add cloudId index for sync
db.version(2).stores({
  sessions: '++id, createdAt, status, synced, cloudId',
  images: '++id, name',
});

// Version 3: add locations table
db.version(3).stores({
  sessions: '++id, createdAt, status, synced, cloudId',
  images: '++id, name',
  locations: '++id, createdAt, cloudId',
});

export { db };

// Helper functies
export async function createSession(input: DeterminationSession['input']): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.sessions.add({
    createdAt: now,
    updatedAt: now,
    status: 'in_progress',
    input,
    steps: [],
    synced: false,
  });
  return id as number;
}

export async function updateSession(
  id: number,
  updates: Partial<DeterminationSession>
): Promise<void> {
  await db.sessions.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function addStep(
  sessionId: number,
  step: DeterminationSession['steps'][0]
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  await db.sessions.update(sessionId, {
    steps: [...session.steps, step],
    updatedAt: new Date().toISOString(),
  });
}

export async function completeSession(
  sessionId: number,
  result: DeterminationSession['result']
): Promise<void> {
  await db.sessions.update(sessionId, {
    status: 'completed',
    result,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllSessions(): Promise<DeterminationSession[]> {
  return await db.sessions.orderBy('createdAt').reverse().toArray();
}

export async function getSession(id: number): Promise<DeterminationSession | undefined> {
  return await db.sessions.get(id);
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

// Sync helpers
export async function getUnsyncedSessions(): Promise<DeterminationSession[]> {
  return await db.sessions
    .filter(s => s.status === 'completed' && !s.cloudId)
    .toArray();
}

export async function markSessionSynced(
  id: number,
  cloudId: string
): Promise<void> {
  await db.sessions.update(id, {
    cloudId,
    synced: true,
    lastSyncedAt: new Date().toISOString(),
  });
}

export async function getSessionByCloudId(cloudId: string): Promise<DeterminationSession | undefined> {
  return await db.sessions.where('cloudId').equals(cloudId).first();
}

export async function addSessionFromCloud(session: Omit<DeterminationSession, 'id'>): Promise<number> {
  const id = await db.sessions.add(session as DeterminationSession);
  return id as number;
}

// ========== Location helpers ==========

export async function createLocation(data: {
  lat: number;
  lng: number;
  naam?: string;
  notitie?: string;
}): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.locations.add({
    createdAt: now,
    updatedAt: now,
    lat: data.lat,
    lng: data.lng,
    naam: data.naam,
    notitie: data.notitie,
    linkedSessionIds: [],
  });
  return id as number;
}

export async function getAllLocations(): Promise<SavedLocation[]> {
  return await db.locations.orderBy('createdAt').reverse().toArray();
}

export async function getLocation(id: number): Promise<SavedLocation | undefined> {
  return await db.locations.get(id);
}

export async function updateLocation(
  id: number,
  updates: Partial<SavedLocation>
): Promise<void> {
  await db.locations.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteLocation(id: number): Promise<void> {
  await db.locations.delete(id);
}

export async function linkSessionToLocation(
  sessionId: number,
  locationId: number
): Promise<void> {
  const location = await db.locations.get(locationId);
  if (!location) throw new Error('Location not found');

  const linkedIds = location.linkedSessionIds || [];
  if (!linkedIds.includes(sessionId)) {
    await db.locations.update(locationId, {
      linkedSessionIds: [...linkedIds, sessionId],
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function unlinkSessionFromLocation(
  sessionId: number,
  locationId: number
): Promise<void> {
  const location = await db.locations.get(locationId);
  if (!location) return;

  await db.locations.update(locationId, {
    linkedSessionIds: location.linkedSessionIds.filter(id => id !== sessionId),
    updatedAt: new Date().toISOString(),
  });
}

// Location sync helpers
export async function getUnsyncedLocations(): Promise<SavedLocation[]> {
  return await db.locations
    .filter(l => !l.cloudId)
    .toArray();
}

export async function markLocationSynced(
  id: number,
  cloudId: string
): Promise<void> {
  await db.locations.update(id, {
    cloudId,
    lastSyncedAt: new Date().toISOString(),
  });
}

export async function getLocationByCloudId(cloudId: string): Promise<SavedLocation | undefined> {
  return await db.locations.where('cloudId').equals(cloudId).first();
}

export async function addLocationFromCloud(location: Omit<SavedLocation, 'id'>): Promise<number> {
  const id = await db.locations.add(location as SavedLocation);
  return id as number;
}
