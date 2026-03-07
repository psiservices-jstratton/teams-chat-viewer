# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

100% client-side React SPA — no backend, no API. All data lives in the browser's IndexedDB.

**Data flow:** User drops SharePoint `*-ArchivedChat.html` files → `parser.ts` extracts conversations via `DOMParser` → stored in IndexedDB via `db.ts` → rendered by React components.

**State management:** Plain `useState` in `App.tsx`. Conversations loaded from IndexedDB on mount and re-fetched after every mutation. Selected conversation derived from the array.

**Key modules:**
- `src/types.ts` — `Conversation` and `Message` interfaces
- `src/lib/parser.ts` — Parses SharePoint HTML exports. Filename format: `{Title}-{Last, First,...}-YYYY-MM-DD-{NumericID}-ArchivedChat.html`. Pre-processes `<emoji>` and `<at>` custom tags before DOM parsing, strips BinaryTree placeholder images.
- `src/lib/db.ts` — IndexedDB CRUD via `idb`. DB `teams-chat-viewer`, store `conversations`, keyPath `id`. Uses `put` (upsert) so re-importing updates rather than duplicates.
- `src/lib/theme.ts` — Dark/light toggle persisted to localStorage

## Styling

Tailwind CSS v4 — uses `@custom-variant` in `index.css` for dark mode (NOT `tailwind.config.js`). Dark mode toggled via `.dark` class on `<html>`. All components must include `dark:` variants.

## Deployment

GitHub Pages via GitHub Actions on push to `main`. Vite `base` is set to `/teams-chat-viewer/` in `vite.config.ts`.
