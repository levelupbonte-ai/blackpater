// Images a member joins to an AI question stay on this device only: they are
// kept in the browser (IndexedDB) to show in the conversation, and sent once
// to the AI. Neither Black Pater nor LevelUp stores them.

const DB = 'bp-assistant';
const STORE = 'images';

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveLocalImages(questionId: string, images: string[]) {
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(images, questionId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function loadLocalImages(ids: string[]): Promise<Record<string, string[]>> {
  const db = await open();
  if (!db || !ids.length) return {};
  const out: Record<string, string[]> = {};
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    for (const id of ids) {
      const req = store.get(id);
      req.onsuccess = () => {
        if (Array.isArray(req.result)) out[id] = req.result.filter((x: unknown) => typeof x === 'string');
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
  return out;
}

/** Signing out of this device or deleting the account forgets them too. */
export async function clearLocalImages() {
  try {
    indexedDB.deleteDatabase(DB);
  } catch {
    /* nothing stored */
  }
}

const MAX_SIDE = 1600;
const MAX_CHARS = 1_300_000;

/** A photo as a JPEG data URL, small enough to send (max 1600 px, ~1 MB). */
export async function compressImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error('type');
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  let width: number;
  let height: number;
  let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  if (bitmap) {
    width = bitmap.width;
    height = bitmap.height;
    draw = (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h);
  } else {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('decode'));
      i.src = url;
    }).finally(() => URL.revokeObjectURL(url));
    width = img.naturalWidth;
    height = img.naturalHeight;
    draw = (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  draw(ctx, w, h);
  bitmap?.close();
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('size');
}
