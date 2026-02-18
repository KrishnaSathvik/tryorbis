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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [runsRes, reportsRes, profilesRes, backlogRes] = await Promise.all([
      supabase.from("generator_runs").select("persona, category, idea_suggestions, created_at"),
      supabase.from("validation_reports").select("idea_text, verdict, scores, created_at"),
      supabase.from("profiles").select("id"),
      supabase.from("backlog_items").select("status, created_at"),
    ]);

    const runs = runsRes.data || [];
    const reports = reportsRes.data || [];
    const totalUsers = profilesRes.data?.length || 0;
    const backlogItems = backlogRes.data || [];

    // ─── Existing aggregations ───
    const personaCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalIdeas = 0;

    for (const run of runs) {
      if (run.persona) {
        const key = run.persona.trim().toLowerCase().replace(/\s+/g, " ");
        personaCounts[key] = (personaCounts[key] || 0) + 1;
      }
      if (run.category) {
        const key = run.category.trim().toLowerCase().replace(/\s+/g, " ");
        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
      }
      const suggestions = Array.isArray(run.idea_suggestions) ? run.idea_suggestions : [];
      totalIdeas += suggestions.length;
    }

    const verdictCounts: Record<string, number> = { Build: 0, Pivot: 0, Skip: 0 };
    for (const r of reports) {
      if (r.verdict in verdictCounts) verdictCounts[r.verdict]++;
    }

    // ─── Leaderboard ───
    const allIdeas: { name: string; score: number; source: string; description?: string }[] = [];
    for (const run of runs) {
      const suggestions = Array.isArray(run.idea_suggestions) ? run.idea_suggestions : [];
      for (const idea of suggestions) {
        if (idea?.name) {
          let desc: string | undefined = undefined;
          if (idea.description) {
            const text = String(idea.description);
            // Take first clause up to ~60 chars, ending at a natural break
            let short = text.slice(0, 60);
            const lastBreak = short.search(/[.,;:!?—]/);
            if (lastBreak > 15) {
              short = short.slice(0, lastBreak + 1).trim();
            } else {
              const wordEnd = short.lastIndexOf(' ');
              short = short.slice(0, wordEnd > 15 ? wordEnd : 60).trim() + '.';
            }
            desc = short;
          }
          allIdeas.push({ name: idea.name, score: idea.demandScore || 0, source: "Generated", description: desc });
        }
      }
    }

    const seen = new Map<string, typeof allIdeas[0]>();
    for (const item of allIdeas) {
      const key = item.name.toLowerCase().trim();
      const existing = seen.get(key);
      if (!existing || item.score > existing.score) seen.set(key, item);
    }
    const leaderboard = Array.from(seen.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // ─── Phase 4: Weekly Trend Data ───
    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr);
      // Get Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().slice(0, 10);
    };

    const weeklyGenerations: Record<string, number> = {};
    const weeklyValidations: Record<string, number> = {};

    for (const run of runs) {
      if (run.created_at) {
        const week = getWeekKey(run.created_at);
        const count = Array.isArray(run.idea_suggestions) ? run.idea_suggestions.length : 0;
        weeklyGenerations[week] = (weeklyGenerations[week] || 0) + count;
      }
    }
    for (const r of reports) {
      if (r.created_at) {
        const week = getWeekKey(r.created_at);
        weeklyValidations[week] = (weeklyValidations[week] || 0) + 1;
      }
    }

    // Merge into sorted time-series (last 12 weeks max)
    const allWeeks = new Set([...Object.keys(weeklyGenerations), ...Object.keys(weeklyValidations)]);
    const trendData = Array.from(allWeeks)
      .sort()
      .slice(-12)
      .map(week => ({
        week,
        label: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        generated: weeklyGenerations[week] || 0,
        validated: weeklyValidations[week] || 0,
      }));

    // ─── Phase 4: Founder Success Tracking ───
    const statusOrder = ["New", "Exploring", "Validated", "Building", "Archived"];
    const statusCounts: Record<string, number> = {};
    for (const item of backlogItems) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    }

    const totalBacklog = backlogItems.length;
    const funnelData = statusOrder.map(status => ({
      status,
      count: statusCounts[status] || 0,
      pct: totalBacklog > 0 ? Math.round(((statusCounts[status] || 0) / totalBacklog) * 100) : 0,
    }));

    // Progression rate: % of ideas that moved beyond "New"
    const progressed = totalBacklog - (statusCounts["New"] || 0);
    const progressionRate = totalBacklog > 0 ? Math.round((progressed / totalBacklog) * 100) : 0;

    // Build rate: % of validations with "Build" verdict
    const buildRate = reports.length > 0 ? Math.round(((verdictCounts["Build"] || 0) / reports.length) * 100) : 0;

    // Active builders: ideas in "Building" status
    const activeBuilders = statusCounts["Building"] || 0;

    const founderSuccess = {
      totalSaved: totalBacklog,
      progressionRate,
      buildRate,
      activeBuilders,
      funnelData,
    };

    // ─── Helpers ───
    const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

    const toSorted = (counts: Record<string, number>, limit: number) =>
      Object.entries(counts)
        .map(([name, count]) => ({ name: titleCase(name), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    // ─── Phase 5: Trending Now (last 24h) ───
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const recentRuns = runs.filter(r => r.created_at && r.created_at >= oneDayAgo);
    const recentReports = reports.filter(r => r.created_at && r.created_at >= oneDayAgo);

    const trendingCategories: Record<string, number> = {};
    const trendingPersonas: Record<string, number> = {};
    let recentIdeasCount = 0;

    for (const run of recentRuns) {
      if (run.category) {
        const key = run.category.trim().toLowerCase().replace(/\s+/g, " ");
        trendingCategories[key] = (trendingCategories[key] || 0) + 1;
      }
      if (run.persona) {
        const key = run.persona.trim().toLowerCase().replace(/\s+/g, " ");
        trendingPersonas[key] = (trendingPersonas[key] || 0) + 1;
      }
      const suggestions = Array.isArray(run.idea_suggestions) ? run.idea_suggestions : [];
      recentIdeasCount += suggestions.length;
    }

    const trendingNow = {
      categories: Object.entries(trendingCategories)
        .map(([name, count]) => ({ name: titleCase(name), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      personas: Object.entries(trendingPersonas)
        .map(([name, count]) => ({ name: titleCase(name), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentIdeas: recentIdeasCount,
      recentValidations: recentReports.length,
      recentRuns: recentRuns.length,
    };
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
      trendData,
      founderSuccess,
      trendingNow,
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
