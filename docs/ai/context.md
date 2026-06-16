# Project Context

This is the only AI context document that must be read before every code change.
Read the other `docs/ai` files only when the task matches their scope.

## Product

Tmanina (طمأنينة) is an Arabic-first Islamic web application and installable PWA.
It provides Quran reading and audio, Adhkar, prayer times and Qibla, an Islamic
calendar, Hadith content, Dhikr/Tasbih counters, radio, and other media.

The primary users are Arabic-speaking visitors using mobile or desktop browsers.
The product must remain usable as a statically hosted GitHub Pages application.

## Current System

- Next.js 13 App Router, React 18, TypeScript, and client-heavy components.
- Static export configured by `next.config.mjs`; there is no backend or database.
- Arabic RTL root layout with Bootstrap RTL, Tailwind CSS, custom CSS, and local
  Quran fonts.
- Navigation is mostly one page controlled by URL query parameters:
  `?view=<section>` and, for media, `?view=media&id=<section>`.
- User preferences and progress are stored in browser `localStorage`.
- `public/sw.js` owns PWA caching, offline behavior, and update notifications.
- External APIs and media providers supply live Quran, Hadith, prayer, chat, radio,
  and audio data. Some Quran/Hadith/assets are bundled under `public/`.
- Production deploys from `main` through `.github/workflows/deploy.yml`.

## Core Paths

- `src/app/`: root layout, global styles, and the main page/navigation shell.
- `src/components/`: feature and UI components.
- `src/components/adhkar/`: Adhkar data, display logic, types, and progress helpers.
- `src/contexts/radio-context.tsx`: shared mini-radio state.
- `src/lib/`: shared utilities and design tokens.
- `public/sw.js`: service worker and cache/update contracts.
- `public/data/`, `public/fonts/`, `public/mushaf/`: large curated/static assets.
- `.github/workflows/deploy.yml`, `WORKFLOW.md`, `DEPLOY_STAGING.md`: release paths.

## Critical Contracts

- Preserve static export: do not add server-only routes, server actions, databases,
  or runtime secrets without explicit approval and an architecture change.
- Preserve `view`/`id` query behavior and existing `localStorage` key semantics.
- Preserve RTL, Arabic text, mobile layouts, desktop layouts, and dark mode.
- Preserve audio/media-session behavior and the single-active-radio coordination.
- Treat service-worker cache names, fetch strategies, messages, and version bumps as
  release-sensitive contracts.
- Treat Quran, Hadith, and Adhkar text as high-integrity content. Do not rewrite,
  normalize, or bulk-edit it without a trusted source and explicit approval.
- Never edit generated `.next`/`out`, installed `node_modules`, or large assets as a
  side effect of an unrelated task.
- Root-level component copies and scripts may be legacy or utilities. The active app
  implementation is under `src/`; verify usage before editing root-level files.

## Common Risk Areas

- Browser-only APIs causing build/hydration failures.
- Query-string navigation regressions.
- Breaking shared `localStorage` data or progress calculations.
- Service-worker changes serving stale or missing assets after deployment.
- External API outages, CORS, response-shape changes, and media autoplay rules.
- Client-exposed credentials, especially `NEXT_PUBLIC_GROQ_API_KEY`.
- Large Quran/Hadith/font/Mushaf assets increasing build or cache size.
- Accessibility and responsive regressions in large inline-styled components.

## AI Working Policy

1. Understand the requested outcome and inspect only impacted files.
2. Read the relevant conditional docs from `AGENTS.md` or `CLAUDE.md`.
3. Identify contracts and user-visible flows before editing.
4. Request explicit approval for architecture, security-model, cache-strategy,
   religious-source, or deployment-process changes.
5. Make the smallest compatible change and avoid unrelated cleanup.
6. Run the smallest useful validation and report anything not validated.
