import { useCallback, useState, useRef } from 'react';
import { parseHTML } from '../lib/parser';
import { addConversation } from '../lib/db';
import type { Conversation } from '../types';

interface UploadAreaProps {
  onUploadComplete: (conversations: Conversation[]) => void;
  compact?: boolean;
}

export function UploadArea({ onUploadComplete, compact }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const htmlFiles = Array.from(files).filter(f =>
        f.name.toLowerCase().endsWith('.html')
      );
      if (htmlFiles.length === 0) {
        setStatus('No .html files found');
        setTimeout(() => setStatus(null), 3000);
        return;
      }

      setStatus(`Processing ${htmlFiles.length} file(s)...`);
      const results: Conversation[] = [];

      for (const file of htmlFiles) {
        try {
          const text = await file.text();
          const conversation = parseHTML(text, file.name);
          await addConversation(conversation);
          results.push(conversation);
        } catch (e) {
          console.error(`Failed to parse ${file.name}:`, e);
        }
      }

      setStatus(`Imported ${results.length} conversation(s)`);
      setTimeout(() => setStatus(null), 3000);
      onUploadComplete(results);
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  if (compact) {
    return (
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors
            ${dragging
              ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            } border-2 border-dashed`}
        >
          {status || '+ Import Chats'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
        ${dragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".html"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {dragging ? 'Drop files here' : 'Drag & drop HTML chat files'}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        or click to browse • Accepts .html files from SharePoint
      </p>
      {status && (
        <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
          {status}
        </p>
      )}
    </div>
  );
}
