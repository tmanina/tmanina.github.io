# Testing Policy

## Current Test Setup

No unit, integration, or E2E framework and no test files were found. Validation is
currently build/lint/typecheck plus targeted manual checks.

Run project commands with Node.js 20, matching `.github/workflows/deploy.yml`.
Older Node versions are not supported by the installed Next.js, TypeScript, and
ESLint toolchain.

## Commands

```bash
# Production static-export build; required for behavior or release changes
npm run build

# TypeScript validation
npx tsc --noEmit

# ESLint validation; package.json currently has no lint script
npx eslint .

# Local manual validation
npm run dev
```

`npm run build:gh` currently runs `next build && next export`. Confirm it still works
before relying on it because static export is already configured in
`next.config.mjs`.

## Minimum Validation By Change

- Documentation only: verify links/paths and inspect `git diff`.
- UI/style/copy: typecheck or lint where relevant, then manually check mobile,
  desktop, RTL, and dark mode.
- Navigation: verify direct query URLs, back/forward behavior, and return flows.
- Browser storage/progress: verify existing data loads, updates persist, and invalid
  stored values fail safely.
- API integration: verify success, loading, empty, malformed, and network-failure
  states.
- Audio/radio: verify play/pause/stop, player coordination, Media Session controls,
  and mobile behavior.
- PWA/service worker: run a production build, test update/offline behavior in a clean
  browser profile, and confirm old caches are cleaned intentionally.
- Release/deployment: run the production build and follow `release-policy.md`.

## Regression Tests

When fixing a meaningful bug, add a focused automated test only if a compatible test
setup already exists or the user approves introducing one. Do not introduce a broad
test framework as an unrelated side effect.

## Reporting

State exactly which commands and manual flows were run, which were not run, and the
remaining risk. Build success alone does not validate third-party APIs, offline
caches, media playback, or responsive UI.
