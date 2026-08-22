import type { Activity, Comment, Complaint, Notification, User } from '@/lib/types';
import { seedDatabase } from '@/lib/seed';

/**
 * Persistence layer.
 *
 * The whole dataset is one JSON document kept in IndexedDB. IndexedDB rather
 * than localStorage because complaint attachments are stored inline as data
 * URLs and would blow past the ~5 MB localStorage budget. The document is read
 * once at boot, held in memory, and written back (debounced) after every
 * mutation, which keeps reads synchronous inside the API layer while staying
 * durable across reloads.
 */

export const DB_NAME = 'campusissues';
export const DB_STORE = 'state';
export const DB_KEY = 'database';
export const SCHEMA_VERSION = 1;

export type Database = {
  schemaVersion: number;
  users: User[];
  complaints: Complaint[];
  comments: Comment[];
  activity: Activity[];
  notifications: Notification[];
};

export function emptyDatabase(): Database {
  return {
    schemaVersion: SCHEMA_VERSION,
    users: [],
    complaints: [],
    comments: [],
    activity: [],
    notifications: [],
  };
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromIdb(): Promise<Database | null> {
  const db = await openIdb();
  try {
    return await new Promise<Database | null>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const request = tx.objectStore(DB_STORE).get(DB_KEY);
      request.onsuccess = () => resolve((request.result as Database) ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function writeToIdb(value: Database): Promise<void> {
  const db = await openIdb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

let cache: Database | null = null;
let loading: Promise<Database> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> = Promise.resolve();

/** Reads the document once, seeding demo data the first time the app runs. */
export function getDatabase(): Promise<Database> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;

  loading = (async () => {
    let stored: Database | null = null;
    try {
      stored = await readFromIdb();
    } catch (error) {
      // A blocked or unavailable IndexedDB must not brick the app - fall back
      // to an in-memory database that simply does not survive a reload.
      console.warn('[campusissues] IndexedDB unavailable, running in memory', error);
    }

    if (stored && stored.schemaVersion === SCHEMA_VERSION) {
      cache = stored;
    } else {
      cache = await seedDatabase(emptyDatabase());
      void persist();
    }
    return cache;
  })();

  return loading;
}

function persist(): Promise<void> {
  if (!cache) return Promise.resolve();
  const snapshot = cache;
  flushing = writeToIdb(snapshot).catch((error) => {
    console.warn('[campusissues] failed to persist database', error);
  });
  return flushing;
}

/** Coalesces bursts of writes (a mutation often touches three collections). */
function schedulePersist(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void persist();
  }, 50);
}

/** Applies a mutation to the in-memory document and schedules a write. */
export async function mutate<T>(fn: (db: Database) => T): Promise<T> {
  const db = await getDatabase();
  const result = fn(db);
  schedulePersist();
  return result;
}

/** Resolves once every pending write has hit disk. Used by data export/reset. */
export async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
    await persist();
  }
  await flushing;
}

/** Wipes stored data and re-seeds. Exposed through Settings. */
export async function resetDatabase(): Promise<Database> {
  cache = await seedDatabase(emptyDatabase());
  loading = Promise.resolve(cache);
  await persist();
  return cache;
}

/** Replaces the whole document, used when importing a previously exported file. */
export async function replaceDatabase(next: Database): Promise<Database> {
  cache = next;
  loading = Promise.resolve(cache);
  await persist();
  return cache;
}
