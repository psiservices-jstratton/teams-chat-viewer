interface WhatsNewBannerProps {
  onDismiss: () => void;
}

export function WhatsNewBanner({ onDismiss }: WhatsNewBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="mt-4 mx-4 max-w-lg w-full bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1 text-sm">
          <p className="font-semibold">New: Export & Import your archive</p>
          <p className="mt-1 text-blue-100">
            You can now back up all your conversations and move them to another browser.
            Look for the gear icon in the sidebar header.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
