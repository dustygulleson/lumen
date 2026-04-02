const DB = 'ft-queue';
const STORE = 'commands';

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    r.onsuccess = e => res(e.target.result);
    r.onerror = rej;
  });
}

export async function enqueue(payload) {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ payload, ts: Date.now() });
    tx.oncomplete = res;
    tx.onerror = rej;
  });
}

export async function dequeueAll() {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const items = [];
    store.openCursor().onsuccess = e => {
      const c = e.target.result;
      if (c) { items.push(c.value); c.delete(); c.continue(); }
      else res(items);
    };
    tx.onerror = rej;
  });
}

export async function getQueueCount() {
  const db = await open();
  return new Promise(res => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).count();
    r.onsuccess = () => res(r.result);
  });
}
