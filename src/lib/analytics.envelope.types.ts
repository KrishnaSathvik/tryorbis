/**
 * Compile-time fixture: AnalyticsEnvelope is a true discriminated union.
 * This file is type-checked by `tsc`; runtime assertions are minimal.
 */
import type {
  AnalyticsEnvelope,
  AnalyticsEventProperties,
  AnalyticsSink,
} from "./analytics";

const sink: AnalyticsSink = (envelope) => {
  if (envelope.event === "quota_hit") {
    const surface: AnalyticsEventProperties["quota_hit"]["surface"] =
      envelope.properties.surface;
    void surface;
  }

  if (envelope.event === "research_succeeded") {
    const duration: number = envelope.properties.duration_ms;
    void duration;
  }

  if (envelope.event === "research_failed") {
    // @ts-expect-error — duration_ms is not on research_failed properties
    const bad: number = envelope.properties.duration_ms;
    void bad;
  }

  if (envelope.event === "landing_cta_click") {
    // @ts-expect-error — surface is not on landing_cta_click properties
    const badSurface = envelope.properties.surface;
    void badSurface;
  }
};

export function assertEnvelopeNarrowing(envelope: AnalyticsEnvelope): void {
  sink(envelope);
}
