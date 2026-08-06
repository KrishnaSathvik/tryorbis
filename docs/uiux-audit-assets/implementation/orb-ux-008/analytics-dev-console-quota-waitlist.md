# Quota / waitlist / post-quota analytics console evidence

Emails and IDs are not present in event properties (email used only for form submission).

`quota_hit` is emitted only when `isQuotaExhausted()` is true (`remaining === 0 && !loading && !unavailable`). Opening the upgrade modal on `!hasCredits` does not imply an analytics event when remaining is null/loading/unavailable.

```json
[
  {
    "event": "quota_hit",
    "properties": {
      "surface": "reports_meter"
    },
    "occurredAt": "2026-08-06T21:16:08.022Z"
  },
  {
    "event": "post_quota_chat_click",
    "properties": {},
    "occurredAt": "2026-08-06T21:16:08.668Z"
  },
  {
    "event": "post_quota_chat_click",
    "properties": {},
    "occurredAt": "2026-08-06T21:16:10.902Z"
  }
]
```

Landing waitlist `waitlist_join` evidence: see `analytics-dev-console-landing.md` (unit-tested; live remote inserts not required for merge readiness).
