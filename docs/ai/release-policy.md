# Release Policy

## Current Release Paths

- Production: pushes to `main` trigger `.github/workflows/deploy.yml`.
- CI uses Node.js 20, runs `npm install`, then `npm run build:gh`, uploads `out/`, and
  deploys it to GitHub Pages.
- Staging: `DEPLOY_STAGING.md` describes building locally and force-pushing the
  generated `out/` contents to a separate staging repository.
- `WORKFLOW.md` contains older/conflicting staging guidance. Treat
  `DEPLOY_STAGING.md` and the actual workflow as stronger evidence, and confirm with
  the owner before changing the process.

## Release Risk Levels

- Low: docs, isolated copy, or small styles with no navigation/PWA/content impact.
- Medium: feature behavior, query navigation, storage keys, external APIs, prayer
  calculations, audio/media behavior, or large asset changes.
- High: service worker/cache/update flow, GitHub Actions/deployment, credentials,
  static-export architecture, or Quran/Hadith/Adhkar source/content changes.

## Required Checks

Before a production-impacting release:

- Confirm scope and risk level.
- Run `npm run build` and relevant lint/typecheck checks.
- Confirm static files are produced in `out/`.
- Manually check the impacted flow on mobile and desktop.
- For PWA changes, test install/update/offline behavior with a clean profile.
- Document environment-variable changes without exposing values.
- Test staging before production when the change is medium or high risk.
- Provide rollback and post-release checks.

## Service Worker Rules

- Bump cache/app versions intentionally when shipped cached assets or strategies
  require invalidation.
- Review every cache deletion and avoid deleting caches not owned by Tmanina.
- Ensure update messages and reload behavior do not create loops.
- Do not cache audio or large Quran assets broadly without size/offline review.

## Rollback

The normal rollback is reverting the source commit and redeploying. Service-worker
or cache changes may require another version bump so clients receive the rollback.
External API or credential changes may also require provider-side rollback/rotation.

## Post-Release Checks

Verify the production URL, direct query links, static assets, external data failures,
media playback, PWA update prompt, and offline app shell as relevant. There is no
monitoring system in the repository, so browser/manual verification is required.
