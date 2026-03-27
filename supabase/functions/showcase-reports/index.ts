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

    const { data, error } = await supabase
      .from("validation_reports")
      .select(
        "id, idea_text, verdict, scores, pros, cons, gap_opportunities, mvp_wedge, kill_test, competitors, evidence_links, market_sizing, wtp_signals, competition_density, market_timing, icp, workaround_detection, feature_gap_map, platform_risk, gtm_strategy, pricing_benchmarks, defensibility, created_at"
      )
      .eq("is_showcase", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return new Response(JSON.stringify({ reports: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("showcase-reports error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
