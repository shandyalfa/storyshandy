// src/models/offlineStore.js
import { openDB, txStore, reqToPromise } from '../utils/idb.js';
import { createStory, getToken } from '../api.js'; // pastikan ada di atas (kalau belum, tambahkan)


const DB_NAME = 'spa-map-stories';
const DB_VERSION = 1;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('savedStories')) {
        db.createObjectStore('savedStories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'key', autoIncrement: true });
      }
    }
  });
}

// ===== BASIC: create/read/delete savedStories =====
export async function saveStory(story) {
  const d = await db();
  const payload = { ...story, savedAt: Date.now() };
  return txStore(d, 'savedStories', 'readwrite', (s) => reqToPromise(s.put(payload)));
}

export async function getSavedStories() {
  const d = await db();
  return txStore(d, 'savedStories', 'readonly', (s) => reqToPromise(s.getAll()));
}

export async function deleteSavedStory(id) {
  const d = await db();
  return txStore(d, 'savedStories', 'readwrite', (s) => reqToPromise(s.delete(id)));
}

// ===== ADVANCED nanti: outbox (boleh belum dipakai dulu) =====
export async function addOutbox(item) {
  const d = await db();
  const payload = { ...item, createdAt: Date.now() };
  return txStore(d, 'outbox', 'readwrite', (s) => reqToPromise(s.add(payload)));
}

export async function getOutbox() {
  const d = await db();
  return txStore(d, 'outbox', 'readonly', (s) => reqToPromise(s.getAll()));
}

export async function deleteOutbox(key) {
  const d = await db();
  return txStore(d, 'outbox', 'readwrite', (s) => reqToPromise(s.delete(key)));
}
export async function syncOutbox() {
    function toFile(x, fallbackName = 'photo.jpg') {
  if (!x) return null;
  if (x instanceof File) return x;
  if (x instanceof Blob) return new File([x], fallbackName, { type: x.type || 'image/jpeg' });
  return null;
}

function pickImageFile(it) {
  // format A: imageFile langsung
  const f1 = toFile(it.imageFile, it.imageName || 'photo.jpg');
  if (f1) return f1;

  // format B: image: { blob, name, type }
  const blob = it.image?.blob;
  if (blob) {
    const name = it.image?.name || 'photo.jpg';
    const file = toFile(blob, name);
    return file;
    }

    return null;
    }
  if (!navigator.onLine) return { sent: 0, total: 0, failed: 0 };

  const items = await getOutbox();
  const res = { sent: 0, total: items.length, failed: 0 };

  for (const it of items) {
    try {
      // kalau item dibuat saat login, tapi sekarang token hilang → stop
      if (it.requiresAuth && !getToken()) {
        throw new Error('Butuh login untuk sync outbox.');
      }

      const blob = it.image?.blob;
        let imageFile;

        if (blob) {
        if (blob instanceof File) {
            imageFile = blob;
        } else {
            imageFile = new File([blob], it.image.name || 'photo.jpg', {
            type: it.image.type || blob.type || 'image/jpeg'
            });
        }
        }

        if (!imageFile) {
        throw new Error('Item outbox tidak punya foto, tidak bisa di-sync.');
        }

        await createStory({
        description: it.description,
        lat: Number(it.lat),
        lng: Number(it.lng),
        imageFile
        });


    await createStory({
        description: it.description,
        lat: Number(it.lat),
        lng: Number(it.lng),
        imageFile
    });

      await deleteOutbox(it.key);
      res.sent++;
    } catch (e) {
      res.failed++;
      break;
    }
  }

  return res;
}
