# Security

## ICS URL proxy (`/api/ics`)

When you run `npm run dev`, `npm run preview`, or `npm start`, the app exposes a small HTTP proxy so calendar subscription URLs (for example Quinyx `webcal://` links) can be fetched without browser CORS blocking.

**Treat this proxy as a local development convenience, not a public multi-tenant service.**

If you deploy Overlap to the internet:

- Do not expose `/api/ics` to untrusted users without additional controls (authentication, rate limits, URL allowlists).
- The proxy blocks loopback, `.local` hostnames, and private/reserved IP literals, but cannot fully eliminate SSRF risk (for example DNS rebinding against a misconfigured deployment).
- Prefer file upload for sensitive calendars when you do not control the server.

## Reporting issues

If you find a security problem, please open a private report via GitHub Security Advisories on this repository, or contact the maintainer directly. Do not open public issues for undisclosed vulnerabilities.
