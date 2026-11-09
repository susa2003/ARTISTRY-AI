export type StoredLayer = { id: string; name: string; visible: boolean; image: Blob };

export type StoredProject = {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: StoredLayer[];
  updatedAt: number;
};

export type CachedImage = {
  id: string;
  name: string;
  original: Blob;
  working: Blob;
  width: number;
  height: number;
  isEdited?: boolean;
  updatedAt: number;
};

const DB_NAME = 'artistry-ai-local';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

async function requestResult<T>(store: 'projects' | 'images', mode: IDBTransactionMode, action: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = action(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local save failed.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Local save failed.'));
  });
}

export const listProjects = () => requestResult<StoredProject[]>('projects', 'readonly', (store) => store.getAll());
export const getProject = (id: string) => requestResult<StoredProject | undefined>('projects', 'readonly', (store) => store.get(id));
export const saveProject = (project: StoredProject) => requestResult<IDBValidKey>('projects', 'readwrite', (store) => store.put(project));
export const removeProject = (id: string) => requestResult<undefined>('projects', 'readwrite', (store) => store.delete(id));
export const getCachedImage = (id: string) => requestResult<CachedImage | undefined>('images', 'readonly', (store) => store.get(id));
export const saveCachedImage = (image: CachedImage) => requestResult<IDBValidKey>('images', 'readwrite', (store) => store.put(image));

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

