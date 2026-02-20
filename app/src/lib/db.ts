import Dexie, { type EntityTable } from 'dexie';
import type { DeterminationSession } from '../types';

// Database definitie
const db = new Dexie('SteentijdDB') as Dexie & {
  sessions: EntityTable<DeterminationSession, 'id'>;
  images: EntityTable<{ id?: number; name: string; blob: Blob }, 'id'>;
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
