import { openDB, type IDBPDatabase } from 'idb';
import type { Conversation } from '../types';

const DB_NAME = 'teams-chat-viewer';
const DB_VERSION = 1;
const STORE_NAME = 'conversations';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title');
        store.createIndex('importedAt', 'importedAt');
      }
    },
  });
}

export async function addConversation(conversation: Conversation): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, conversation);
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => b.importedAt - a.importedAt);
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function renameConversation(id: string, newTitle: string): Promise<void> {
  const db = await getDB();
  const conv = await db.get(STORE_NAME, id);
  if (conv) {
    conv.title = newTitle;
    await db.put(STORE_NAME, conv);
  }
}

export async function searchConversations(query: string): Promise<Conversation[]> {
  const all = await getAllConversations();
  const q = query.toLowerCase();
  return all.filter(
    c =>
      c.title.toLowerCase().includes(q) ||
      c.participants.some(p => p.toLowerCase().includes(q))
  );
}
