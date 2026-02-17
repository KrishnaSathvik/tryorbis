import { supabase } from "@/integrations/supabase/client";

// ─── Generator Runs ───

export async function saveGeneratorRunDb(run: {
  persona: string;
  category: string;
  region?: string;
  platform?: string;
  problemClusters: any[];
  ideaSuggestions: any[];
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

export async function getAllGeneratorRuns() {
  const { data } = await supabase
    .from("generator_runs")
    .select("*")
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

export async function getAllValidationReports() {
  const { data } = await supabase
    .from("validation_reports")
    .select("*")
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

export async function getPublicStats() {
  const [runsRes, reportsRes] = await Promise.all([
    supabase.from("generator_runs").select("id, idea_suggestions"),
    supabase.from("validation_reports").select("id"),
  ]);
  const runs = runsRes.data || [];
  const reports = reportsRes.data || [];
  const totalIdeas = runs.reduce((s: number, r: any) => {
    const suggestions = Array.isArray(r.idea_suggestions) ? r.idea_suggestions : [];
    return s + suggestions.length;
  }, 0);
  return {
    totalUsers: new Set([...runs, ...reports].map(() => "x")).size, // approximate
    totalIdeas,
    totalValidations: reports.length,
    totalRuns: runs.length,
  };
}

// ─── Community stats (for landing + trends) ───

export async function getCommunityStats() {
  const [runsRes, reportsRes, profilesRes] = await Promise.all([
    supabase.from("generator_runs").select("*"),
    supabase.from("validation_reports").select("*"),
    supabase.from("profiles").select("id"),
  ]);
  
  const runs = runsRes.data || [];
  const reports = reportsRes.data || [];
  const profiles = profilesRes.data || [];

  return { runs, reports, totalUsers: profiles.length };
}
