// src/models/offlineStore.js
import { openDB } from 'idb';
import { createStory } from '../api.js';

const DB_NAME = 'spa-map-stories';
const DB_VERSION = 1;

const STORE_SAVED = 'savedStories';
const STORE_OUTBOX = 'outbox';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Saved stories (keyPath: id)
    if (!db.objectStoreNames.contains(STORE_SAVED)) {
      const store = db.createObjectStore(STORE_SAVED, { keyPath: 'id' });
      store.createIndex('savedAt', 'savedAt');
    }

    // Outbox untuk antrian offline (autoIncrement key)
    if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
      const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'key', autoIncrement: true });
      store.createIndex('createdAt', 'createdAt');
    }
  },
});

/* =========================
 *  CRUD: SAVED STORIES
 * ========================= */

// READ ALL
export async function getSavedStories() {
  return (await dbPromise).getAll(STORE_SAVED);
}

// READ ONE (optional)
export async function getSavedStory(id) {
  return (await dbPromise).get(STORE_SAVED, id);
}

// CREATE/UPDATE (pakai put biar id sama tidak error)
export async function saveStory(story) {
  const payload = {
    ...story,
    savedAt: story.savedAt ?? Date.now(),
  };
  return (await dbPromise).put(STORE_SAVED, payload);
}

// DELETE
export async function deleteSavedStory(id) {
  return (await dbPromise).delete(STORE_SAVED, id);
}

/* =========================
 *  CRUD: OUTBOX (offline queue)
 * ========================= */

export async function addOutbox({ description, lat, lng, imageFile }) {
  const image =
    imageFile
      ? {
          blob: imageFile instanceof Blob ? imageFile : new Blob([imageFile]),
          name: imageFile.name || 'photo.jpg',
          type: imageFile.type || 'image/jpeg',
        }
      : null;

  const item = {
    description,
    lat,
    lng,
    image,
    createdAt: Date.now(),
  };

  return (await dbPromise).add(STORE_OUTBOX, item);
}

export async function getOutbox() {
  return (await dbPromise).getAll(STORE_OUTBOX);
}

export async function deleteOutbox(key) {
  return (await dbPromise).delete(STORE_OUTBOX, key);
}

/**
 * Kirim semua item outbox saat sudah online.
 * Return: { total, sent, failed }
 */
export async function syncOutbox() {
  const db = await dbPromise;
  const items = await db.getAll(STORE_OUTBOX);

  let sent = 0;
  let failed = 0;

  for (const it of items) {
    try {
      const file =
        it.image?.blob
          ? (it.image.blob instanceof File
              ? it.image.blob
              : new File([it.image.blob], it.image.name || 'photo.jpg', { type: it.image.type || it.image.blob.type }))
          : null;

      await createStory({
        description: it.description,
        lat: Number(it.lat),
        lng: Number(it.lng),
        imageFile: file,
      });

      await db.delete(STORE_OUTBOX, it.key);
      sent++;
    } catch (e) {
      failed++;
      // biarkan tetap di outbox supaya bisa dicoba lagi
    }
  }

  return { total: items.length, sent, failed };
}
