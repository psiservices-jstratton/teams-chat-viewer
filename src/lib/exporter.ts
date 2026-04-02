import { getAllConversations, addConversation } from './db';
import { STORAGE_KEY } from './theme';
import type { Conversation } from '../types';

interface ExportEnvelope {
  version: number;
  exportedAt: string;
  preferences: {
    theme: string;
  };
  conversations: Conversation[];
}

export async function exportArchive(): Promise<void> {
  const conversations = await getAllConversations();
  const envelope: ExportEnvelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences: {
      theme: localStorage.getItem(STORAGE_KEY) || 'light',
    },
    conversations,
  };

  const json = JSON.stringify(envelope);
  const blob = new Blob([json], { type: 'application/json' });
  const compressed = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(compressed).blob();

  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(compressedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-archive-${date}.tcv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export interface ImportProgress {
  current: number;
  total: number;
}

export async function importArchive(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<number> {
  // Decompress
  let json: string;
  try {
    const decompressed = file.stream().pipeThrough(new DecompressionStream('gzip'));
    json = await new Response(decompressed).text();
  } catch {
    throw new Error('Invalid archive file. Please select a .tcv file exported from Chat Archive.');
  }

  // Parse JSON
  let envelope: ExportEnvelope;
  try {
    envelope = JSON.parse(json);
  } catch {
    throw new Error('Invalid archive file. Please select a .tcv file exported from Chat Archive.');
  }

  // Validate structure
  if (!envelope.version || !Array.isArray(envelope.conversations)) {
    throw new Error("This file doesn't appear to be a valid Chat Archive export.");
  }
  if (envelope.version > 1) {
    throw new Error('This archive was created by a newer version of Chat Archive. Please update the app.');
  }

  // Validate each conversation has required fields
  for (const conv of envelope.conversations) {
    if (!conv.id || !conv.title || !Array.isArray(conv.messages)) {
      throw new Error("This file doesn't appear to be a valid Chat Archive export.");
    }
  }

  // Upsert conversations
  const total = envelope.conversations.length;
  for (let i = 0; i < total; i++) {
    await addConversation(envelope.conversations[i]);
    onProgress?.({ current: i + 1, total });
  }

  // Restore preferences
  if (envelope.preferences?.theme) {
    localStorage.setItem(STORAGE_KEY, envelope.preferences.theme);
  }

  return total;
}
