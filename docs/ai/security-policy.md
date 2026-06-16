# Security And Content Integrity Policy

## Current Security Model

This is a public static client application. There is no authentication,
authorization, backend, database, tenant boundary, or server-side secret storage.
All shipped JavaScript, public assets, and `NEXT_PUBLIC_*` values are visible to
users.

## Credentials And Environment Variables

- Never treat `NEXT_PUBLIC_*` as secret.
- Never commit API keys, tokens, credentials, private URLs, or `.env.local` values.
- Do not print credentials in logs, errors, screenshots, docs, or final responses.
- Client-side calls that require a secret are architecturally unsafe. Explain the
  issue and obtain explicit approval before introducing a secure server-side proxy
  or changing that integration.
- `.env.local` is currently tracked by Git even though it is local configuration.
  Do not inspect or expose its contents unnecessarily; credential remediation
  requires owner coordination and key rotation.

## User Input And Browser Data

- Treat chat input, API responses, query parameters, and stored browser values as
  untrusted.
- Escape or sanitize any content rendered as HTML. Preserve safe external-link
  attributes such as `rel="noopener noreferrer"`.
- Validate/parsing failures must not crash the whole application.
- Store only non-sensitive preferences/progress in `localStorage`; it is readable by
  any script running on the origin.
- Do not add analytics, tracking, fingerprinting, geolocation, notifications, or new
  permissions without explicit user approval and clear consent behavior.

## External Integrations

- Use HTTPS and allowlist trusted domains where practical.
- Do not assume third-party availability, correctness, CORS behavior, or stable
  response shapes.
- Do not send unnecessary user data to external APIs.
- Review service-worker caching before caching API responses that may contain user
  input or sensitive data.

## Religious Content Integrity

- AI-generated religious answers are not authoritative. Preserve visible uncertainty
  and trusted-source constraints.
- Do not weaken source filtering, fabricate citations, or present generated text as
  verified scholarship.
- Quran, Hadith, Adhkar, and prayer/calculation changes require source verification.
- Bulk content/source changes require explicit approval and a documented validation
  method.

## Security Change Gate

Obtain explicit approval before changing credential handling, HTML sanitization,
external-domain allowlists, data collection, browser permissions, or religious
content/source policy.
