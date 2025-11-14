
# Accessible Chat + Video Room

A demo React + TypeScript + Vite application showcasing an accessibility-first, real-time chat and video room built with Stream (Chat + Video) SDKs. The project focuses on semantic markup, ARIA live regions, keyboard navigation, focus management, screen reader announcements, captions, and accessible controls.

## What this project builds
- An accessible real-time chat with semantic message lists, aria-live announcements, keyboard navigation, accessible inputs, and media attachments.
- An inclusive video room with accessible custom controls (mute/unmute, leave, screen share), live captions, and keyboard/touch support.
- Utility hooks to centralize accessibility logic: useAccessibilitySettings, useAnnouncements, useFocusManager, useCallManagement, useStreamConnection.

## Project structure (high level)
```
src/
 ├─ components/
 │  ├─ AccessibleChat/
 │  ├─ AccessibleVideo/
 │  ├─ Auth/
 │  └─ Common/
 ├─ hooks/
 ├─ utils/
 ├─ types/
 └─ assets/
```

## Prerequisites
- Node.js 18+ recommended
- A Stream account (for Chat & Video API keys) for a full demo

## Environment
Create a `.env` file in the project root with at least:
```
VITE_API_BASE_URL=http://localhost:4000
VITE_STREAM_API_KEY=your_stream_api_key_here
```
The frontend uses `import.meta.env.VITE_API_BASE_URL` for the auth endpoint. The demo backend must expose a minimal `/auth` and `/users` POST endpoint.

## Install & Run (development)
```bash
npm install
npm run dev
```

## Build & Preview (production)
```bash
npm run build
npm run preview
```

## Key files to inspect
- `src/hooks/useStreamConnection.ts` — connects to backend and initializes Stream Chat + Video clients.
- `src/hooks/useAnnouncements.ts` — React hook for queued screen reader announcements (uses `utils/screenReader.ts`).
- `src/utils/screenReader.ts` — low-level aria-live DOM utility for non-React contexts.
- `src/components/AccessibleChat/*` — chat UI, list, input, styles.
- `src/components/AccessibleVideo/*` — video UI, controls, captions.
- `src/App.tsx` — app shell and composition of chat + video.

## Testing & Accessibility checks
- Manual testing with VoiceOver (macOS) and NVDA (Windows)
- Keyboard-only navigation testing
- Automated checks: axe-core or Lighthouse

## Recommendations / Notes
- Use `useAnnouncements` from hooks in React components; keep `utils/screenReader` for non-React/global handlers.
- Consolidate duplicate CSS (e.g., duplicated @keyframes) to avoid conflicts.
- Keep accessibility concerns (focus management, live regions, reduced motion) in hooks to reuse across components.

## Resources
- Stream Docs: https://getstream.io/
- WCAG Quick Reference: https://www.w3.org/WAI/standards-guidelines/wcag/
- axe-core: https://www.deque.com/axe/
