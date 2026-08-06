# Research analytics console evidence

Generate regular success (mocked edge responses). Validate lifecycle covered by automated tests.

```json
[
  {
    "event": "research_started",
    "properties": {
      "type": "generate",
      "mode": "regular",
      "credits_left": 2
    },
    "occurredAt": "2026-08-06T21:16:03.085Z"
  },
  {
    "event": "research_succeeded",
    "properties": {
      "type": "generate",
      "mode": "regular",
      "duration_ms": 361
    },
    "occurredAt": "2026-08-06T21:16:03.446Z"
  },
  {
    "event": "idea_saved",
    "properties": {
      "from": "generator_result"
    },
    "occurredAt": "2026-08-06T21:16:05.403Z"
  }
]
```

## Structural integrity

`research_succeeded` requires a structurally usable report (`src/lib/researchResponseValidation.ts`). A bare HTTP `{}` (or missing scores/verdict / missing stage arrays) emits `research_failed` with `invalid_response`, does not save, and does not render a fake zero-score / Skip report. Empty Generate arrays (`problemClusters: []`, `ideaSuggestions: []`) remain a valid success (“no opportunities found”).
