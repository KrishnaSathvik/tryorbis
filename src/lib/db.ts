import { supabase } from "@/integrations/supabase/client";

// ─── Generator Runs ───

export async function saveGeneratorRunDb(run: {
  persona: string;
  category: string;
  region?: string;
  platform?: string;
  problemClusters: any[];
  ideaSuggestions: any[];
  wtpSignals?: any;
  competitionDensity?: any;
  marketTiming?: any;
  icp?: any;
  workaroundDetection?: any;
  featureGapMap?: any;
  platformRisk?: any;
  gtmStrategy?: any;
  pricingBenchmarks?: any;
  defensibility?: any;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("generator_runs").insert({
    user_id: user.id,
    persona: run.persona,
    category: run.category,
    region: run.region || null,
    budget_scope: null,
    platform: run.platform || null,
    problem_clusters: run.problemClusters,
    idea_suggestions: run.ideaSuggestions,
    wtp_signals: run.wtpSignals || null,
    competition_density: run.competitionDensity || null,
    market_timing: run.marketTiming || null,
    icp: run.icp || null,
    workaround_detection: run.workaroundDetection || null,
    feature_gap_map: run.featureGapMap || null,
    platform_risk: run.platformRisk || null,
    gtm_strategy: run.gtmStrategy || null,
    pricing_benchmarks: run.pricingBenchmarks || null,
    defensibility: run.defensibility || null,
  });
  if (error) throw error;
}

export async function getMyGeneratorRuns() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("generator_runs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Validation Reports ───

export async function saveValidationReportDb(report: {
  ideaText: string;
  scores: any;
  verdict: string;
  pros: string[];
  cons: string[];
  gapOpportunities: string[];
  mvpWedge: string;
  killTest: string;
  competitors: any[];
  evidenceLinks: string[];
  marketSizing?: any;
  wtpSignals?: any;
  competitionDensity?: any;
  marketTiming?: any;
  icp?: any;
  workaroundDetection?: any;
  featureGapMap?: any;
  platformRisk?: any;
  gtmStrategy?: any;
  pricingBenchmarks?: any;
  defensibility?: any;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("validation_reports").insert({
    user_id: user.id,
    idea_text: report.ideaText,
    scores: report.scores,
    verdict: report.verdict,
    pros: report.pros,
    cons: report.cons,
    gap_opportunities: report.gapOpportunities,
    mvp_wedge: report.mvpWedge,
    kill_test: report.killTest,
    competitors: report.competitors,
    evidence_links: report.evidenceLinks,
    market_sizing: report.marketSizing || null,
    wtp_signals: report.wtpSignals || null,
    competition_density: report.competitionDensity || null,
    market_timing: report.marketTiming || null,
    icp: report.icp || null,
    workaround_detection: report.workaroundDetection || null,
    feature_gap_map: report.featureGapMap || null,
    platform_risk: report.platformRisk || null,
    gtm_strategy: report.gtmStrategy || null,
    pricing_benchmarks: report.pricingBenchmarks || null,
    defensibility: report.defensibility || null,
  });
  if (error) throw error;
}

export async function getMyValidationReports() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("validation_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Backlog ───

export async function addToBacklogDb(item: {
  ideaName: string;
  source: string;
  sourceId?: string;
  demandScore?: number;
  overallScore?: number;
  status?: string;
  notes?: string[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("backlog_items").insert({
    user_id: user.id,
    idea_name: item.ideaName,
    source: item.source,
    source_id: item.sourceId || null,
    demand_score: item.demandScore || null,
    overall_score: item.overallScore || null,
    status: item.status || "New",
    notes: item.notes || [],
  });
  if (error) throw error;
}

export async function getMyBacklog() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function updateBacklogStatusDb(id: string, status: string) {
  const { error } = await supabase
    .from("backlog_items")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function addNoteToBacklogDb(id: string, note: string) {
  const { data: item } = await supabase
    .from("backlog_items")
    .select("notes")
    .eq("id", id)
    .single();
  if (!item) return;
  const notes = Array.isArray(item.notes) ? [note, ...item.notes] : [note];
  await supabase.from("backlog_items").update({ notes }).eq("id", id);
}

export async function removeFromBacklogDb(id: string) {
  await supabase.from("backlog_items").delete().eq("id", id);
}

export async function renameBacklogItemDb(id: string, newName: string) {
  const { error } = await supabase
    .from("backlog_items")
    .update({ idea_name: newName })
    .eq("id", id);
  if (error) throw error;
}

export async function updateNoteInBacklogDb(id: string, noteIndex: number, newText: string) {
  const { data: item } = await supabase
    .from("backlog_items")
    .select("notes")
    .eq("id", id)
    .single();
  if (!item) return;
  const notes = Array.isArray(item.notes) ? [...item.notes] : [];
  if (noteIndex < 0 || noteIndex >= notes.length) return;
  notes[noteIndex] = newText;
  await supabase.from("backlog_items").update({ notes }).eq("id", id);
}

// ─── Stats ───
// Community stats are now served by the community-stats edge function
