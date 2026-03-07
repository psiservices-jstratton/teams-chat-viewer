# Teams Chat Viewer — Copilot Instructions

## Project Overview
A **100% client-side** React SPA for browsing archived Microsoft Teams chat HTML exports. No backend, no API — all data lives in the user's browser via IndexedDB.

## Tech Stack
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (uses `@custom-variant` for dark mode, NOT `tailwind.config.js`)
- **idb** (lightweight IndexedDB wrapper)
- **No backend** — no server, no API routes, no database server

## Architecture
```
src/
├── types.ts              # Conversation and Message interfaces
├── lib/
│   ├── parser.ts         # Parses SharePoint HTML exports → Conversation objects
│   ├── db.ts             # IndexedDB CRUD operations via idb
│   └── theme.ts          # Dark/light theme with localStorage persistence
├── components/
│   ├── Sidebar.tsx       # Left panel: search, chat list, delete, rename
│   ├── ChatView.tsx      # Main panel: conversation header + message list
│   ├── MessageBubble.tsx # Individual message with sender color + link chips
│   ├── UploadArea.tsx    # Drag-and-drop / click-to-upload HTML files
│   ├── ThemeToggle.tsx   # Sun/moon icon toggle
│   └── EmptyState.tsx    # Shown when no conversations are imported
└── App.tsx               # Root layout, state management, wires components together
```

## Key Patterns

### State Management
- App-level state in `App.tsx` via `useState` hooks — no external state library
- Conversations are loaded from IndexedDB on mount and kept in sync after mutations (add, delete, rename)
- Selected conversation ID tracked in state; actual conversation object derived from the array

### HTML Parser (`lib/parser.ts`)
- Parses the filename for chat title, participants, date, and numeric ID
- Filename format: `{Title}-{Last, First,Last2, First2,...}-{YYYY}-{MM}-{DD}-{NumericID}-ArchivedChat.html`
- Uses browser-native `DOMParser` to extract messages from `div.post > div.main` elements
- Each message has: sender (`span.pFrom`), timestamp (`span.pDate`), content (HTML), and extracted links

### IndexedDB (`lib/db.ts`)
- Database: `teams-chat-viewer`, version 1
- Single object store: `conversations` with keyPath `id`
- Indexes on `title` and `importedAt`
- Uses `put` (upsert) so re-importing the same file updates rather than duplicates

### Styling
- Tailwind v4 with `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`
- Dark mode toggled via `.dark` class on `<html>` element
- All components use `dark:` variants for theming

## Deployment
- GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- Vite `base` set to `/teams-chat-viewer/` for subpath serving
- Auto-deploys on push to `main`

## Common Tasks

### Adding a new feature
1. If it involves stored data, update `types.ts` and `db.ts`
2. Create or modify components in `src/components/`
3. Wire into `App.tsx` if it needs app-level state
4. Run `npm run build` to verify TypeScript + Vite build passes

### Modifying the parser
- Test changes against the HTML format documented in `parser.ts`
- The parser must handle missing fields gracefully (fallback values for title, date, participants)

### Adding new UI components
- Use Tailwind utility classes; always include both light and `dark:` variants
- Follow existing patterns: functional components, props interfaces, no external state management
