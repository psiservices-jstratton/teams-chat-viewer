import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  senderColor: string;
  prevSender: string | null;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function MessageBubble({ message, senderColor, prevSender }: MessageBubbleProps) {
  const showHeader = message.sender !== prevSender;

  return (
    <div className={`flex gap-3 px-4 ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
      {/* Avatar column */}
      <div className="flex-shrink-0 w-9">
        {showHeader && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: senderColor }}
          >
            {message.sender
              .split(' ')
              .map(w => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-bold text-sm" style={{ color: senderColor }}>
              {message.sender}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>

        {message.links.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                  bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                  hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors
                  max-w-xs truncate border border-blue-200 dark:border-blue-800"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate">
                  {(() => {
                    try {
                      const url = new URL(link);
                      return url.hostname + url.pathname.slice(0, 30);
                    } catch {
                      return link.slice(0, 40);
                    }
                  })()}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
