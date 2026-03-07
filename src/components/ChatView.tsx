import { useEffect, useRef, useMemo } from 'react';
import type { Conversation } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatViewProps {
  conversation: Conversation;
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

export function ChatView({ conversation }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const senderMap = useMemo(() => {
    const map = new Map<string, string>();
    conversation.messages.forEach(m => getSenderColor(m.sender, map));
    return map;
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {conversation.title}
        </h2>
        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
          {conversation.participants.map((p, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {p}
            </span>
          ))}
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
