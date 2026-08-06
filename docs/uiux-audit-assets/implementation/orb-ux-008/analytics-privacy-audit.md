# Privacy audit — ORB-UX-008

## Method
Captured development console envelopes from Landing, guest/onboarding, research, quota/waitlist, and Dashboard resume flows. Also covered by `src/lib/analytics.privacy.test.ts`.

## Assertions
Event envelopes contain only:
- `event`
- `properties` (allowlisted coarse enums / numbers / booleans)
- `occurredAt` (ISO-8601)

No envelopes included user IDs, emails, prompts, idea text, titles, URLs, file names, record IDs, or raw error messages.

## Sample safe properties observed
`placement`, `from`, `goal`, `type`, `mode`, `credits_left`, `duration_ms`, `code`, `surface`, `source`
