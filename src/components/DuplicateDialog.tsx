import type { Conversation } from '../types';

interface DuplicateDialogProps {
  existing: Conversation;
  incoming: Conversation;
  onReplace: () => void;
  onSkip: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DuplicateDialog({ existing, incoming, onReplace, onSkip }: DuplicateDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Duplicate Conversation
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          A conversation with this ID already exists. Would you like to replace it or skip this file?
        </p>

        <div className="space-y-3 mb-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Existing</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{existing.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(existing.date)} · {existing.messages.length} message{existing.messages.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">New Import</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{incoming.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(incoming.date)} · {incoming.messages.length} message{incoming.messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onReplace}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}
