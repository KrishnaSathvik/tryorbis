

# Remove Confusing Badges from Market Intelligence Cards

## Problem
The "Sourced" / "Estimated" badges and the contextual status badges ("Strong", "Fragmented", "Growing", "Strong Signal", etc.) next to each Market Intelligence section title are confusing to users. Terms like "Sourced Fragmented" or "Sourced Strong" don't make sense when read together.

## What Changes

**Remove the `DataSourceBadge` component usage** from all 10 Market Intelligence section headers in `IntelligenceSections.tsx`. The status badges (Strong, Fragmented, Growing, etc.) on the right side of each card header are useful context and will remain -- only the Sourced/Estimated badges will be removed.

### Files to Edit

1. **`src/components/IntelligenceSections.tsx`** -- Remove all `<DataSourceBadge>` instances (lines 49, 89, 119, 146, 227, 261, 299, 352, 384, 423) and the import on line 4.

2. **`src/components/DataSourceBadge.tsx`** -- Delete this file entirely since it will no longer be used anywhere.

### Sections Affected
- Willingness to Pay (was: Sourced)
- Competition Density (was: Sourced)
- Market Timing (was: Sourced)
- Ideal Customer Profile (was: Estimated)
- Workaround Detection (was: Sourced)
- Feature Gap Map (was: Sourced)
- Platform Risk (was: Estimated)
- Go-To-Market Strategy (was: Estimated)
- Pricing Benchmarks (was: Sourced)
- Defensibility and Moat (was: Estimated)

The contextual status badges on the right side (e.g., "Strong", "Growing", "Fragmented", "Low") will remain as they convey useful information about the actual finding.

