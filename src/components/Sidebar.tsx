import type { Conversation } from '../types';
import { useState, useRef, useEffect } from 'react';

interface SidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
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

export function Sidebar({ conversations, selectedId, onSelect, onDelete, onRename }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

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

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {search ? 'No matching chats' : 'No chats imported yet'}
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors
                ${conv.id === selectedId
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
                }`}
            >
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
          ))
        )}
      </div>
    </div>
  );
}
