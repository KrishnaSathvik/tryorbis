import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS — this is a public endpoint returning only aggregates
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [runsRes, reportsRes, profilesRes] = await Promise.all([
      supabase.from("generator_runs").select("persona, category, idea_suggestions"),
      supabase.from("validation_reports").select("idea_text, verdict, scores"),
      supabase.from("profiles").select("id"),
    ]);

    const runs = runsRes.data || [];
    const reports = reportsRes.data || [];
    const totalUsers = profilesRes.data?.length || 0;

    // Aggregate persona counts
    const personaCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalIdeas = 0;

    for (const run of runs) {
      // Persona
      if (run.persona) {
        const key = run.persona.trim().toLowerCase().replace(/\s+/g, " ");
        personaCounts[key] = (personaCounts[key] || 0) + 1;
      }
      // Category
      if (run.category) {
        const key = run.category.trim().toLowerCase().replace(/\s+/g, " ");
        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
      }
      // Count ideas
      const suggestions = Array.isArray(run.idea_suggestions) ? run.idea_suggestions : [];
      totalIdeas += suggestions.length;
    }

    // Verdict distribution
    const verdictCounts: Record<string, number> = { Build: 0, Pivot: 0, Skip: 0 };
    for (const r of reports) {
      if (r.verdict in verdictCounts) verdictCounts[r.verdict]++;
    }

    // Top ideas leaderboard (aggregated, no user-identifiable data)
    const allIdeas: { name: string; score: number; source: string; verdict?: string }[] = [];
    for (const run of runs) {
      const suggestions = Array.isArray(run.idea_suggestions) ? run.idea_suggestions : [];
      for (const idea of suggestions) {
        if (idea?.name) {
          allIdeas.push({ name: idea.name, score: idea.demandScore || 0, source: "Generated" });
        }
      }
    }
    for (const r of reports) {
      const raw = (r.idea_text || "").trim();
      const shortName = raw.includes(":") ? raw.split(":")[0].trim() : raw.slice(0, 60);
      const scores = r.scores as any;
      const score = scores ? Math.round(((scores.demand || 0) + (scores.pain || 0) + (scores.mvpFeasibility || 0)) / 3) : 0;
      allIdeas.push({ name: shortName, score, source: "Validated", verdict: r.verdict });
    }

    // Deduplicate leaderboard
    const seen = new Map<string, typeof allIdeas[0]>();
    for (const item of allIdeas) {
      const key = item.name.toLowerCase().trim();
      const existing = seen.get(key);
      if (!existing || item.score > existing.score) seen.set(key, item);
    }
    const leaderboard = Array.from(seen.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Title-case helper
    const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

    const toSorted = (counts: Record<string, number>, limit: number) =>
      Object.entries(counts)
        .map(([name, count]) => ({ name: titleCase(name), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return new Response(JSON.stringify({
      totalUsers,
      totalIdeas,
      totalValidations: reports.length,
      totalRuns: runs.length,
      personaData: toSorted(personaCounts, 6),
      categoryData: toSorted(categoryCounts, 6),
      verdictData: Object.entries(verdictCounts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value })),
      leaderboard,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("community-stats error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
