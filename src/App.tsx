import { useState, useEffect, useCallback } from 'react';
import { getAllConversations, deleteConversation, renameConversation, renameParticipant, pinConversation, unpinConversation, reorderPinnedConversations } from './lib/db';
import { applyTheme, getStoredTheme } from './lib/theme';
import type { Conversation } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { UploadArea } from './components/UploadArea';
import { EmptyState } from './components/EmptyState';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    applyTheme(getStoredTheme());
    getAllConversations().then(convs => {
      setConversations(convs);
      if (convs.length > 0) setSelectedId(convs[0].id);
    });
  }, []);

  const handleUploadComplete = useCallback(async () => {
    const convs = await getAllConversations();
    setConversations(convs);
    if (convs.length > 0 && !selectedId) {
      setSelectedId(convs[0].id);
    }
  }, [selectedId]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      const convs = await getAllConversations();
      setConversations(convs);
      if (selectedId === id) {
        setSelectedId(convs.length > 0 ? convs[0].id : null);
      }
    },
    [selectedId]
  );

  const handleRename = useCallback(
    async (id: string, newTitle: string) => {
      await renameConversation(id, newTitle);
      const convs = await getAllConversations();
      setConversations(convs);
    },
    []
  );

  const handleRenameParticipant = useCallback(
    async (id: string, oldName: string, newName: string) => {
      await renameParticipant(id, oldName, newName);
      const convs = await getAllConversations();
      setConversations(convs);
    },
    []
  );

  const handlePin = useCallback(async (id: string) => {
    await pinConversation(id);
    const convs = await getAllConversations();
    setConversations(convs);
  }, []);

  const handleUnpin = useCallback(async (id: string) => {
    await unpinConversation(id);
    const convs = await getAllConversations();
    setConversations(convs);
  }, []);

  const handleReorderPinned = useCallback(async (orderedIds: string[]) => {
    await reorderPinnedConversations(orderedIds);
    const convs = await getAllConversations();
    setConversations(convs);
  }, []);

  const selected = conversations.find(c => c.id === selectedId) || null;

  return (
    <div className="h-full flex bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col transition-all
          ${sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-base font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Chat Archive
          </h1>
          <ThemeToggle />
        </div>

        {/* Upload area (compact) */}
        <UploadArea onUploadComplete={handleUploadComplete} compact />

        {/* Chat list */}
        <Sidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDelete}
          onRename={handleRename}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onReorderPinned={handleReorderPinned}
        />
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <ChatView conversation={selected} onRenameParticipant={handleRenameParticipant} />
        ) : (
          <EmptyState onUploadComplete={handleUploadComplete} />
        )}
      </div>
    </div>
  );
}
