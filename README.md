# Teams Chat Viewer

A client-side web app for browsing archived Microsoft Teams chat exports in a familiar Slack/Teams-like interface.

## Features

- **Drag & drop upload** - Import HTML chat files exported from SharePoint
- **Persistent storage** - Conversations stored in your browser's IndexedDB (survives refreshes)
- **Chat UI** - Slack/Teams-style message bubbles with sender colors, timestamps, and clickable links
- **Search & filter** - Find conversations by title or participant name
- **Dark / Light theme** - Toggle with persistence

## Usage

1. Visit the deployed site (or run locally)
2. Drag and drop your `*-ArchivedChat.html` files onto the upload area
3. Browse your conversations in the sidebar and click to view

## Development

```bash
npm install
npm run dev
```

## Deployment

This app is deployed automatically to GitHub Pages via GitHub Actions on every push to `main`.

**To set up on your own repo:**
1. Push this repo to GitHub
2. Go to **Settings > Pages > Source** and select **GitHub Actions**
3. Push a commit (or manually trigger the workflow) - the site will be live at:
   `https://<your-username>.github.io/teams-chat-viewer/`

## Tech Stack

React - TypeScript - Vite - Tailwind CSS - IndexedDB (via idb)
