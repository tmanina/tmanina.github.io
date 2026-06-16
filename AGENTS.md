# Tmanina AI Instructions

This repository uses a repo-based AI development framework. Keep changes small,
traceable, and compatible with the existing static PWA.

## Required Reading

Before any code change, read:

- `docs/ai/context.md`

Do not read all AI docs by default. Read only the documents relevant to the task:

- Architecture, module boundaries, routing, data flow, PWA, or deployment:
  `docs/ai/architecture.md`
- Implementation conventions or UI work: `docs/ai/coding-standards.md`
- Behavior changes, bug fixes, or validation: `docs/ai/testing-policy.md`
- Environment variables, external APIs, user input, browser storage, or religious
  content: `docs/ai/security-policy.md`
- Production, GitHub Pages, service worker, cache, or release work:
  `docs/ai/release-policy.md`
- Code review tasks: `docs/ai/code-review.md`
- Unclear product terms: `docs/ai/glossary.md`

## Explicit Approval Required

Explain the impact and obtain explicit user approval before:

- Changing the static-export architecture or adding a backend/database/auth system.
- Changing URL query contracts (`view` and `id`) or shared `localStorage` keys.
- Changing the service-worker caching strategy, cache ownership, or update flow.
- Exposing, moving, or changing how API credentials are used.
- Replacing a religious-content source or changing Quran/Hadith/Adhkar text in bulk.
- Changing the staging or production deployment process.

## Work Rules

- Inspect only impacted modules and nearby dependencies.
- Preserve Arabic RTL behavior, responsive layouts, dark mode, and PWA behavior.
- Reuse existing components, Bootstrap patterns, Tailwind utilities, and `@/*` imports.
- Treat `public/data`, `public/fonts`, and `public/mushaf` as curated/static assets.
- Do not edit generated directories (`.next`, `out`) or dependency files
  (`node_modules`) unless explicitly requested.
- Do not edit root-level legacy/utility files when the active implementation is under
  `src/` unless the task specifically targets them.
- Never place secrets in `NEXT_PUBLIC_*`, source files, logs, or committed docs.
- Do not silently broaden scope, refactor unrelated code, or remove behavior.

## Validation And Final Response

Use `docs/ai/testing-policy.md` for the smallest relevant validation. Every final
response must state changed files, validation run, remaining risks, and rollback
notes.
