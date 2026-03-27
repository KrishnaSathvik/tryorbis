export interface ShowcaseReport {
  id: string;
  idea_text: string;
  verdict: string;
  scores: { demand: number; pain: number; competition: number; mvpFeasibility: number };
  pros: string[];
  cons: string[];
  gap_opportunities: string[];
  mvp_wedge: string | null;
  kill_test: string | null;
  competitors: { name: string; weakness: string; pricing?: string }[];
  evidence_links: string[];
  market_sizing: { tam?: string; sam?: string; som?: string } | null;
  wtp_signals: { strength?: string; summary?: string; signals?: { quote: string; source: string }[] } | null;
  competition_density: { level?: string; summary?: string; competitorCount?: number } | null;
  market_timing: { phase?: string; summary?: string } | null;
  icp: { summary?: string } | null;
  workaround_detection: { severity?: string; summary?: string } | null;
  feature_gap_map: { gaps?: { feature: string; opportunity: string }[]; summary?: string; topWedge?: string } | null;
  platform_risk: { level?: string; summary?: string } | null;
  gtm_strategy: { primaryChannel?: string; summary?: string } | null;
  pricing_benchmarks: { suggestedRange?: { low: string; mid: string; high: string }; summary?: string } | null;
  defensibility: { overallStrength?: string; summary?: string } | null;
  created_at: string;
}

let cached: ShowcaseReport[] | null = null;

const COLUMNS = "id,idea_text,verdict,scores,pros,cons,gap_opportunities,mvp_wedge,kill_test,competitors,evidence_links,market_sizing,wtp_signals,competition_density,market_timing,icp,workaround_detection,feature_gap_map,platform_risk,gtm_strategy,pricing_benchmarks,defensibility,created_at";

export async function fetchShowcaseReports(): Promise<ShowcaseReport[]> {
  if (cached && cached.length > 0) return cached;

  try {
    // Use raw REST API to avoid typed client issues with the is_showcase column
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/validation_reports?select=${COLUMNS}&is_showcase=eq.true&order=created_at.desc&limit=5`;
    const res = await fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      cached = data as ShowcaseReport[];
      return cached;
    }
    return [];
  } catch {
    return [];
  }
}
