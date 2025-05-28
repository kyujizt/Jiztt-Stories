import { openDB } from "idb";

const DB_NAME = "storyAppDB";
const DB_VERSION = 1;
const OBJECT_STORE_NAME = "stories";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      db.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
    }
  },
});

// Simpan story ke IndexedDB
export async function saveStory(story) {
  try {
    const db = await dbPromise;
    await db.put(OBJECT_STORE_NAME, story);
    console.log("✅ Story tersimpan di IndexedDB:", story);
    return true;
  } catch (error) {
    console.error("❌ Error saat menyimpan story ke IndexedDB:", error);
    return false;
  }
}

// Ambil semua story dari IndexedDB
export async function getStories() {
  try {
    const db = await dbPromise;
    const stories = await db.getAll(OBJECT_STORE_NAME);
    return stories;
  } catch (error) {
    console.error("❌ Error saat mengambil data dari IndexedDB:", error);
    return [];
  }
}

// Ambil story berdasarkan ID
export async function getStoryById(id) {
  try {
    const db = await dbPromise;
    const story = await db.get(OBJECT_STORE_NAME, id);
    return story;
  } catch (error) {
    console.error(`❌ Error saat mengambil story dengan ID ${id}:`, error);
    return null;
  }
}

// Hapus story berdasarkan ID
export async function deleteStory(id) {
  try {
    const db = await dbPromise;
    await db.delete(OBJECT_STORE_NAME, id);
    console.log(`🚫 Story dengan ID ${id} dihapus dari IndexedDB.`);
    return true;
  } catch (error) {
    console.error(`❌ Error saat menghapus story dengan ID ${id}:`, error);
    return false;
  }
}

// Periksa apakah story sudah tersimpan
export async function isStorySaved(id) {
  try {
    const db = await dbPromise;
    const story = await db.get(OBJECT_STORE_NAME, id);
    return !!story;
  } catch (error) {
    console.error(`❌ Error saat memeriksa story dengan ID ${id}:`, error);
    return false;
  }
}

// Hapus semua story
export async function clearAllStories() {
  try {
    const db = await dbPromise;
    await db.clear(OBJECT_STORE_NAME);
    console.log("🧹 Semua story dihapus dari IndexedDB.");
    return true;
  } catch (error) {
    console.error("❌ Error saat menghapus semua story:", error);
    return false;
  }
}
