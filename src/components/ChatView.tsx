import { useEffect, useRef, useMemo, useState } from 'react';
import type { Conversation } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatViewProps {
  conversation: Conversation;
  onRenameParticipant: (convId: string, oldName: string, newName: string) => void;
}

const SENDER_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

function getSenderColor(sender: string, senderMap: Map<string, string>): string {
  if (!senderMap.has(sender)) {
    senderMap.set(sender, SENDER_COLORS[senderMap.size % SENDER_COLORS.length]);
  }
  return senderMap.get(sender)!;
}

export function ChatView({ conversation, onRenameParticipant }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const senderMap = useMemo(() => {
    const map = new Map<string, string>();
    conversation.messages.forEach(m => getSenderColor(m.sender, map));
    return map;
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversation.id]);

  useEffect(() => {
    if (editingName) editInputRef.current?.focus();
  }, [editingName]);

  const startEdit = (name: string) => {
    setEditingName(name);
    setEditValue(name);
  };

  const commitEdit = () => {
    if (editingName && editValue.trim() && editValue.trim() !== editingName) {
      onRenameParticipant(conversation.id, editingName, editValue.trim());
    }
    setEditingName(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {conversation.title}
        </h2>
        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
          {conversation.participants.map((p, i) =>
            editingName === p ? (
              <input
                key={i}
                ref={editInputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditingName(null);
                }}
                className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <span
                key={i}
                onClick={() => startEdit(p)}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                  hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                title="Click to rename"
              >
                {p}
              </span>
            )
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {conversation.messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {conversation.messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            senderColor={getSenderColor(msg.sender, senderMap)}
            prevSender={i > 0 ? conversation.messages[i - 1].sender : null}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
