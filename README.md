# A4 Image Composer (MVP)

Mobile-first web app to place multiple images on an A4 page, transform them (move/scale/rotate), and export as PNG or PDF.

## Features

- A4 portrait workspace (fixed 210x297 ratio)
- Responsive fit-to-screen editor
- Add multiple images from device file picker
- Per-image transform: drag, resize, rotate
- Active selection with transform handles
- Grid toggle
- Snap toggle (drag snap to grid)
- Export PNG (high-resolution, ~300 DPI width basis)
- Export PDF (single A4 page)

## Stack

- Next.js 14 + React + TypeScript
- react-konva / konva (canvas editor + transforms)
- jsPDF (PDF export)
- Vitest (unit tests)

## Local run

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## CLI verification

```bash
npm run verify
```

This runs tests and production build in one command.

## Deploy to Vercel (GitHub-connected)

1. Push to GitHub
2. Import repo in Vercel
3. Deploy (no extra env vars needed for MVP)

Every new push triggers auto-deploy.
