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

export async function renameParticipant(
  id: string,
  oldName: string,
  newName: string
): Promise<void> {
  const db = await getDB();
  const conv = await db.get(STORE_NAME, id);
  if (!conv) return;
  conv.participants = conv.participants.map((p: string) =>
    p === oldName ? newName : p
  );
  conv.messages = conv.messages.map((m: { sender: string }) => ({
    ...m,
    sender: m.sender === oldName ? newName : m.sender,
  }));
  await db.put(STORE_NAME, conv);
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

export async function pinConversation(id: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const maxOrder = all.reduce((max, c) => Math.max(max, c.pinOrder ?? -1), -1);
  const conv = await db.get(STORE_NAME, id);
  if (conv) {
    conv.isPinned = true;
    conv.pinOrder = maxOrder + 1;
    await db.put(STORE_NAME, conv);
  }
}

export async function unpinConversation(id: string): Promise<void> {
  const db = await getDB();
  const conv = await db.get(STORE_NAME, id);
  if (!conv) return;
  const removedOrder = conv.pinOrder ?? 0;
  conv.isPinned = false;
  conv.pinOrder = undefined;
  await db.put(STORE_NAME, conv);

  // Re-normalize remaining pinned orders
  const all = await db.getAll(STORE_NAME);
  const pinned = all
    .filter(c => c.isPinned && c.id !== id && (c.pinOrder ?? 0) > removedOrder)
    .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0));
  for (const c of pinned) {
    c.pinOrder = (c.pinOrder ?? 0) - 1;
    await db.put(STORE_NAME, c);
  }
}

export async function reorderPinnedConversations(orderedIds: string[]): Promise<void> {
  const db = await getDB();
  for (let i = 0; i < orderedIds.length; i++) {
    const conv = await db.get(STORE_NAME, orderedIds[i]);
    if (conv && conv.isPinned) {
      conv.pinOrder = i;
      await db.put(STORE_NAME, conv);
    }
  }
}
