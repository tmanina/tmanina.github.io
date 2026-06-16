# Tmanina Claude Code Instructions

This repository uses a repo-based AI development framework. Keep changes small,
traceable, and compatible with the existing static PWA.

Always read before changing code:

@docs/ai/context.md

Read additional documents only when relevant:

- Architecture, module boundaries, routing, data flow, PWA, or deployment:
  `@docs/ai/architecture.md`
- Implementation conventions or UI work: `@docs/ai/coding-standards.md`
- Behavior changes, bug fixes, or validation: `@docs/ai/testing-policy.md`
- Environment variables, external APIs, user input, browser storage, or religious
  content: `@docs/ai/security-policy.md`
- Production, GitHub Pages, service worker, cache, or release work:
  `@docs/ai/release-policy.md`
- Code review tasks: `@docs/ai/code-review.md`
- Unclear product terms: `@docs/ai/glossary.md`

Obtain explicit user approval before changing the static-export architecture, URL
query contracts, shared browser-storage keys, service-worker strategy, credential
handling, religious-content sources, or deployment process.

Preserve Arabic RTL behavior, responsive layouts, dark mode, static export, and PWA
behavior. Do not edit `.next`, `out`, `node_modules`, or large curated assets unless
explicitly requested. Never expose secrets through `NEXT_PUBLIC_*`, source, logs, or
documentation.

Final responses must state changed files, validation run, remaining risks, and
rollback notes.
