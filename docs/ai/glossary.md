# Product Glossary

## Tmanina / طمأنينة

The Arabic-first Islamic web application in this repository.

## View

The top-level application section selected by the `view` query parameter in
`src/app/page.tsx`, for example `?view=media`.

## Media Section

A nested media feature selected by the `id` query parameter while
`view=media`, for example `?view=media&id=quran`.

## Adhkar / أذكار

Rememberance/supplication content grouped by contexts such as morning, evening,
prayer, and sleep. Progress is stored locally in the browser.

## Dhikr / Tasbih

Counting/remembrance features. Some counters feed the dashboard through shared
`localStorage` data and the `tmanina-progress-updated` browser event.

## Mushaf

The Quran page-reading experience. The vector Mushaf uses curated SVG pages under
`public/mushaf/pages`; the other Quran reader also uses Quran APIs and QCF fonts.

## QCF Fonts

Page-specific Quran Complex fonts under `public/fonts/qcf`. Their page/font mapping
is a content-rendering contract.

## Mini Radio

The persistent radio player coordinated through `src/contexts/radio-context.tsx` so
radio playback state remains shared across relevant components.

## App Shell

The minimal files/pages cached by `public/sw.js` so the PWA can open offline.

## Static Export

The Next.js build mode configured by `output: "export"` that produces `out/` for
GitHub Pages. Server-only Next.js features are incompatible with this architecture.

## Production And Staging

Production is deployed from source through GitHub Actions. Staging is documented as
a separate repository receiving locally generated `out/` files.
