# Landing analytics console evidence

Captured in development with no analytics sink configured.

CTA placements (browser):

```json
[
  {
    "event": "landing_cta_click",
    "properties": {
      "placement": "hero"
    },
    "occurredAt": "2026-08-06T21:15:54.185Z"
  },
  {
    "event": "landing_cta_click",
    "properties": {
      "placement": "navigation"
    },
    "occurredAt": "2026-08-06T21:15:55.052Z"
  }
]
```

## Waitlist join coverage

Landing `WaitlistForm` `waitlist_join` is verified by direct unit tests in `src/pages/Landing.analytics.test.tsx`:

| Case | Behavior |
| ---- | -------- |
| Successful new insert (`error: null`) | One `waitlist_join` with `{ source: "other" }`; no email in properties |
| Duplicate `23505` | Already-on-list UI; no `waitlist_join` |
| Non-duplicate error | Safe error UI; no `waitlist_join`; raw backend message not shown |
| Render only | No events |

Live remote waitlist inserts are **not** required for merge readiness: the waitlist table enforces a unique email constraint, so repeated browser inserts against the shared remote backend are stateful and unreliable as regression evidence. Unit coverage plus sanitized DEV console transcripts for CTAs are sufficient.
