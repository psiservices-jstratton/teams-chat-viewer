import type { Conversation } from '../types';
import { useState, useRef, useEffect, useCallback } from 'react';

interface SidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onReorderPinned: (orderedIds: string[]) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
];

function getColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Sidebar({ conversations, selectedId, onSelect, onDelete, onRename, onPin, onUnpin, onReorderPinned }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [pinnedCollapsed, setPinnedCollapsed] = useState(() => {
    return localStorage.getItem('pinned-collapsed') === 'true';
  });
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('below');
  const draggedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const togglePinnedCollapsed = useCallback(() => {
    setPinnedCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pinned-collapsed', String(next));
      return next;
    });
  }, []);

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const filtered = search
    ? conversations.filter(
        c =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.participants.some(p => p.toLowerCase().includes(search.toLowerCase()))
      )
    : conversations;

  const pinnedConversations = filtered
    .filter(c => c.isPinned)
    .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0));

  const unpinnedConversations = filtered.filter(c => !c.isPinned);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverPosition(e.clientY < midY ? 'above' : 'below');
    setDragOverId(id);
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = draggedIdRef.current;
    if (!draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }

    const currentOrder = pinnedConversations.map(c => c.id);
    const fromIndex = currentOrder.indexOf(draggedId);
    if (fromIndex === -1) { handleDragEnd(); return; }

    // Remove dragged item
    currentOrder.splice(fromIndex, 1);

    // Insert at new position
    let toIndex = currentOrder.indexOf(targetId);
    if (toIndex === -1) { handleDragEnd(); return; }
    if (dragOverPosition === 'below') toIndex += 1;
    currentOrder.splice(toIndex, 0, draggedId);

    onReorderPinned(currentOrder);
    handleDragEnd();
  };

  const renderConversationItem = (conv: Conversation, isPinnedSection: boolean) => (
    <div
      key={conv.id}
      onClick={() => onSelect(conv.id)}
      draggable={isPinnedSection}
      onDragStart={isPinnedSection ? (e) => handleDragStart(e, conv.id) : undefined}
      onDragOver={isPinnedSection ? (e) => handleDragOver(e, conv.id) : undefined}
      onDrop={isPinnedSection ? (e) => handleDrop(e, conv.id) : undefined}
      onDragEnd={isPinnedSection ? handleDragEnd : undefined}
      className={`group flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors
        ${conv.id === selectedId
          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
        }
        ${dragOverId === conv.id && dragOverPosition === 'above' ? 'border-t-2 border-t-blue-500' : ''}
        ${dragOverId === conv.id && dragOverPosition === 'below' ? 'border-b-2 border-b-blue-500' : ''}`}
    >
      {/* Drag handle for pinned items */}
      {isPinnedSection && (
        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 -ml-1 mr-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getColor(conv.title)} flex items-center justify-center text-white text-xs font-bold`}>
        {getInitials(conv.title)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {editingId === conv.id ? (
            <input
              ref={editInputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="font-medium text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                border border-blue-400 rounded px-1 py-0 w-full mr-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate"
              onDoubleClick={e => {
                e.stopPropagation();
                startRename(conv.id, conv.title);
              }}
              title="Double-click to rename"
            >
              {conv.title}
            </span>
          )}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Pin/Unpin button */}
            <button
              onClick={e => {
                e.stopPropagation();
                if (conv.isPinned) { onUnpin(conv.id); } else { onPin(conv.id); }
              }}
              className={`p-1 rounded transition-all ${
                conv.isPinned
                  ? 'text-amber-500 hover:text-amber-600 opacity-100 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              }`}
              title={conv.isPinned ? 'Unpin conversation' : 'Pin conversation'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={conv.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                startRename(conv.id, conv.title);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-all"
              title="Rename conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
              title="Delete conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {conv.participants.slice(0, 3).join(', ')}
          {conv.participants.length > 3 && ` +${conv.participants.length - 3}`}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {conv.messages.length} messages
          </span>
          {(() => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const dateStr = lastMsg?.timestamp || conv.date;
            return dateStr ? (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                • {formatDate(dateStr)}
              </span>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm
              text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Scrollable area containing both pinned and all chats */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned / Favorites section */}
        {pinnedConversations.length > 0 && (
          <div>
            <button
              onClick={togglePinnedCollapsed}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider
                text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${pinnedCollapsed ? '' : 'rotate-90'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span>Favorites</span>
              <span className="ml-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0 text-xs font-medium">
                {pinnedConversations.length}
              </span>
            </button>
            {!pinnedCollapsed && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                {pinnedConversations.map(conv => renderConversationItem(conv, true))}
              </div>
            )}
          </div>
        )}

        {/* All Chats section */}
        {pinnedConversations.length > 0 && unpinnedConversations.length > 0 && (
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            All Chats
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {search ? 'No matching chats' : 'No chats imported yet'}
          </div>
        ) : (
          unpinnedConversations.map(conv => renderConversationItem(conv, false))
        )}
      </div>
    </div>
  );
}
