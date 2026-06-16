# Coding Standards

## Existing Conventions

- Use TypeScript for active application code; JavaScript remains in a few utilities.
- Use function components and React hooks.
- Add `"use client"` when a module uses hooks or browser-only APIs.
- Import application modules with the `@/*` alias when practical.
- Keep interfaces/types near their feature unless genuinely shared.
- Existing formatting generally uses double quotes and no semicolons. Match the file
  being edited instead of reformatting unrelated lines.
- UI currently mixes Bootstrap classes, Tailwind utilities, global CSS, component
  CSS, and JSX styles. Extend the nearest existing pattern for a localized change.
- Arabic UI copy and comments are normal. Preserve `lang="ar"` and `dir="rtl"`.

## Frontend Rules

- Guard `window`, `document`, `navigator`, and `localStorage` usage so static build
  and initial rendering remain valid.
- Put subscriptions, timers, media handlers, and DOM listeners in effects and clean
  them up.
- Preserve loading, empty, error, offline, and disabled states.
- Preserve keyboard/accessibility behavior, labels, and responsive layouts.
- Reuse shared radio context and existing feature components; do not create a second
  global state mechanism for a local task.
- Do not change public query parameters or storage keys casually. If a schema must
  change, provide backward-compatible migration/fallback logic.

## Data And Integration Rules

- Treat third-party responses as unreliable. Check `response.ok`, handle malformed
  or absent data, and show a useful Arabic fallback.
- Encode user-controlled URL parameters.
- Do not add an external dependency when existing code or browser APIs are enough.
- Keep large static content out of component source when a `public/data` asset is
  more appropriate.
- Do not modify Quran/Hadith/Adhkar content or source attribution without verifying a
  trusted source and obtaining approval for bulk/content-policy changes.

## Scope Rules

- Do not mix feature work with broad refactors or formatting.
- Verify whether root-level duplicates are used before changing them; prefer `src/`
  for the active app.
- Never manually edit `.next`, `out`, `node_modules`, or `tsconfig.tsbuildinfo`.
- Do not regenerate large font/Mushaf/data assets unless explicitly requested.
