# Architecture

## Technology Stack

- Runtime/build: Node.js 20 in GitHub Actions; Next.js 13.5 static export.
- UI: React 18, TypeScript, Bootstrap 5 RTL, Tailwind CSS, CSS modules/global CSS,
  Framer Motion, Lucide, and Font Awesome.
- Domain library: `adhan` for Islamic prayer/calendar-related calculations.
- Persistence: browser `localStorage` and Cache Storage only.
- Backend/database/auth: none.
- Hosting: GitHub Pages.
- PWA: `public/manifest.json` and a hand-maintained `public/sw.js`.
- Automated tests: none found.

## Runtime Shape

`src/app/layout.tsx` supplies the Arabic RTL document shell, fonts, global CDN
dependencies, footer, and global scripts. `src/app/page.tsx` is a client component
that acts as the main application shell. It derives the active section from
`useSearchParams()` and renders feature components rather than using separate route
files.

Most feature components are client components because they use browser APIs,
`localStorage`, media playback, or external APIs. The app is exported to `out/` and
served as static files.

## Module Map

### Application Shell And Navigation

- Paths: `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/header.tsx`,
  `src/components/navigation.tsx`, `src/components/footer.tsx`
- Contract: query parameters `view` and `id` select the visible feature.
- Risks: broken deep links, mobile fixed-navigation overlap, RTL/layout regression.

### Quran And Islamic Content

- Paths: `src/components/quran-reader.tsx`, `vector-mushaf.tsx`,
  `surah-reader.tsx`, `surah-list.tsx`, `hadith-*.tsx`, `adhkar/`,
  `public/data/`, `public/mushaf/`, `public/fonts/`
- Dependencies: bundled content plus Quran.com and Hadith APIs.
- Risks: content integrity, font/page mapping, large assets, offline behavior.

### Prayer, Calendar, And Progress

- Paths: `prayer-times.tsx`, `islamic-calendar.tsx`, `dhikr-counter.tsx`,
  `tasbih-circle.tsx`, `dashboard.tsx`, `adhkar/utils.ts`
- Dependencies: Aladhan APIs, `adhan`, browser storage, custom storage events.
- Risks: timezone/date correctness, city mapping, shared progress schema.

### Audio And Media

- Paths: `media-page.tsx`, `audio-quran.tsx`, `radio-player.tsx`,
  `mini-radio-player.tsx`, `sahaba-player.tsx`, `podcast-player.tsx`,
  `ruqyah-player.tsx`, `live-player.tsx`, `src/contexts/radio-context.tsx`
- Dependencies: third-party streams/embeds and Media Session API.
- Risks: autoplay restrictions, background playback, single-active-player behavior,
  provider availability, mobile controls.

### PWA And Offline

- Paths: `public/sw.js`, `public/manifest.json`, `install-prompt.tsx`,
  `update-notification.tsx`, service-worker registration in `src/app/page.tsx`
- Contract: the service worker controls cache lifecycle, offline navigation, Quran
  pre-cache messages, and update notifications.
- Risks: stale deployments, accidental cache deletion, large downloads, reload loops.

### Religious Chat

- Path: `src/components/floating-chat.tsx`
- Dependency: Groq chat completions called directly from the browser.
- Risks: public credential exposure, untrusted generated religious advice, XSS/link
  handling, cost/rate abuse. Read `security-policy.md` before changes.

## Important Data Flows

1. Navigation: click -> router pushes query parameters -> `page.tsx`/`media-page.tsx`
   read parameters -> selected component renders.
2. Preferences/progress: component reads `localStorage` after mount -> updates state
   -> writes changes -> some modules dispatch `tmanina-progress-updated`.
3. PWA: page registers `/sw.js` -> service worker caches app shell/data -> update
   messages reach `update-notification.tsx` -> user reloads into the new version.
4. External data: client component fetches a public API -> maps response into local
   UI state -> shows an error or fallback on failure.
5. Media: user interaction starts audio/embed -> Media Session handlers expose
   controls -> radio context coordinates radio state.

## Architecture Change Gate

Obtain explicit approval before changing routing contracts, introducing backend
services, moving persistence away from browser storage, changing service-worker
strategy, replacing core providers, or restructuring module boundaries.
