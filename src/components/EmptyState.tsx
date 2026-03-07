import { UploadArea } from './UploadArea';
import type { Conversation } from '../types';

interface EmptyStateProps {
  onUploadComplete: (conversations: Conversation[]) => void;
}

export function EmptyState({ onUploadComplete }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Teams Chat Viewer
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Browse your archived Teams conversations in a familiar chat interface.
            Upload the HTML files exported from SharePoint to get started.
          </p>
        </div>
        <UploadArea onUploadComplete={onUploadComplete} />
      </div>
    </div>
  );
}
