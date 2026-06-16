# Code Review Checklist

Lead with concrete findings ordered by severity and include file/line references.
Focus on regressions and missing validation rather than style preferences.

## Correctness

- Does the change solve only the requested problem?
- Are query navigation and browser history preserved?
- Are effects/listeners/timers cleaned up?
- Are loading, empty, error, and offline states handled?
- Are date, timezone, prayer, and progress calculations still correct?

## Architecture And Scope

- Does the app still support static export and GitHub Pages?
- Are existing module boundaries and shared contexts preserved?
- Are root legacy files, generated output, or large assets changed unnecessarily?
- Is an architecture/cache/deployment change missing explicit approval?

## Security And Content

- Are keys or secrets exposed in client code, `NEXT_PUBLIC_*`, logs, or docs?
- Is user/API/generated HTML safely escaped and sanitized?
- Are external URLs and query inputs handled safely?
- Are religious content and sources verified and represented responsibly?

## Frontend And PWA

- Are Arabic RTL, responsive behavior, accessibility, and dark mode preserved?
- Are `localStorage` keys and formats backward-compatible?
- Are audio coordination and Media Session behavior preserved?
- Could service-worker changes create stale caches, large downloads, or reload loops?

## Validation

- Were the smallest relevant build, typecheck, lint, and manual flows run?
- Are third-party/API/offline/media risks called out when not testable?
- Is rollback clear, especially for service-worker changes?

## Review Output

Use:

```md
## Findings
## Open Questions
## Validation Gaps
## Change Summary
```

If there are no findings, say so clearly and still list residual risks or missing
validation.
