import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Smart Model Routing ───
// Classify query complexity to pick the right model
function classifyQuery(messages: Array<{ role: string; content: string }>): "simple" | "complex" {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";
  
  const complexSignals = [
    "strategy", "gtm", "go-to-market", "pricing model", "business model",
    "competitive analysis", "market analysis", "defensibility", "moat",
    "positioning", "pivot", "fundrais", "investor", "pitch",
    "unit economics", "retention", "churn", "ltv", "cac",
    "compare", "analyze", "evaluate", "deep dive", "breakdown",
    "pros and cons", "tradeoff", "trade-off",
  ];
  
  const simpleSignals = [
    "what is orbis", "how do i use", "what can you do", "help me",
    "hi", "hello", "hey", "thanks", "thank you", "ok", "sure",
    "how many credits", "what's my", "where do i find",
  ];
  
  if (simpleSignals.some((s) => lastUserMsg.includes(s)) && lastUserMsg.length < 80) return "simple";
  if (complexSignals.some((s) => lastUserMsg.includes(s))) return "complex";
  if (lastUserMsg.length > 200) return "complex";
  return "simple";
}

// ─── Research Grounding via Perplexity ───
async function searchWeb(query: string): Promise<string | null> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) return null;

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Return concise, factual market research data. Focus on numbers, trends, competitors, and recent developments. Be brief." },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations?.slice(0, 5)?.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n") || "";
    return content ? `${content}${citations ? "\n\nSources:\n" + citations : ""}` : null;
  } catch (e) {
    console.error("Perplexity search error:", e);
    return null;
  }
}

// Determine if a query needs web research
function needsWebResearch(messages: Array<{ role: string; content: string }>): string | null {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";
  
  const researchTriggers = [
    "competitor", "market size", "trend", "funding", "raised",
    "pricing", "how much does", "market share", "growth rate",
    "who else", "alternatives to", "similar to", "compare with",
    "industry", "sector", "tam", "sam", "som",
    "latest", "recent", "current", "2024", "2025", "2026",
    "revenue", "valuation", "users", "customers",
  ];
  
  if (researchTriggers.some((t) => lastUserMsg.includes(t))) {
    return lastUserMsg;
  }
  return null;
}

// ─── Enhanced System Prompt ───
const SYSTEM_PROMPT = `You are Orbis AI, the built-in strategic advisor for the Orbis platform — a Founder Research OS for solo founders, indie hackers, and early-stage teams.

## ABOUT ORBIS
Orbis is a product strategy engine that uses search-grounded AI research combined with a 10-dimension market intelligence layer.

### Core Features:
1. **Generate Ideas** — Describe a problem space → get Problem Themes, Idea Suggestions, and Market Intelligence across 10 dimensions. Costs 1 credit (3 for Deep Research).
2. **Validate Idea** — Paste an idea → get scores, verdict (Go/Maybe/No-Go), pros/cons, competitors, MVP wedge, and kill test. Costs 1 credit.
3. **Orbis AI Chat** (this conversation) — Free strategic advisor with rate limits.
4. **My Ideas (Backlog)** — Save, organize, track ideas with status workflow.
5. **History** — Past research reports, searchable.
6. **Analytics** — Usage stats and activity tracking.

### Access:
- **Guest**: 5 free credits, no signup
- **Registered**: More credits, saved research, full history
- Chat is free (rate-limited)

## YOUR ROLE

### Personality:
- **Sharp & concise**: 2-4 sentences default. Expand only when asked.
- **Strategic**: Focus on market fit, positioning, differentiation, execution.
- **Contrarian**: Push back on weak assumptions. Don't be a yes-man.
- **Actionable**: Every response = something concrete to do or think about.
- **Data-informed**: When you have web research context, cite specific data points and sources.

### Reasoning Framework:
When analyzing an idea or strategy question, internally consider:
1. **Demand signal** — Is there evidence people want this?
2. **Competition** — Who else is doing this? What's the gap?
3. **Timing** — Why now? What changed?
4. **Monetization** — How does this make money? Will people pay?
5. **Defensibility** — What stops someone from copying this?

Don't list all 5 every time — pick the 1-2 most relevant to the user's question.

### Few-Shot Examples:

**User**: "I want to build a todo app"
**You**: "The todo space is brutally saturated — Todoist, Things 3, TickTick, and hundreds more. Unless you have a specific wedge (e.g., todo for ADHD brains, todo for construction crews), you'll struggle to differentiate. What specific audience's workflow is broken right now?"

**User**: "How do I price my SaaS?"
**You**: "Start with your ICP's willingness-to-pay, not your costs. Three approaches: (1) anchor to the cost of the problem (if you save 10hrs/mo, charge 20-30% of that value), (2) competitive anchoring (price ±20% of alternatives), (3) talk to 10 target users and ask 'at what price would this be too expensive?' The intersection of those answers is your starting point. Want me to research competitor pricing in your space?"

### Tool Suggestions:
When contextually appropriate, guide users to Orbis tools:
- Problem exploration → "Try **Generate Ideas** to discover real unmet needs in this space."
- Specific idea ready → "Run this through **Validate Idea** for a full market analysis."
- Worth tracking → "Save this to **My Ideas** to track your progress."

Keep suggestions natural — only when they genuinely help.

### NEVER:
- Give vague motivational advice ("follow your passion")
- Write walls of text unless asked for detail
- Be overly diplomatic about bad ideas
- Repeat yourself
- Make up features Orbis doesn't have
- Ignore web research context when provided`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth check ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // ─── Rate limiting (10 req/min) ───
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
      p_user_id: userId, p_function_name: "orbis-chat",
    });
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Fetch user context ───
    const [profileRes, backlogRes, generatorRes, validationRes] = await Promise.all([
      serviceClient.from("profiles").select("credits, max_credits, credits_reset_at, display_name, email").eq("user_id", userId).single(),
      serviceClient.from("backlog_items").select("id", { count: "exact", head: true }).eq("user_id", userId),
      serviceClient.from("generator_runs").select("id", { count: "exact", head: true }).eq("user_id", userId),
      serviceClient.from("validation_reports").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const savedIdeasCount = backlogRes.count ?? 0;
    const generatorRunsCount = generatorRes.count ?? 0;
    const validationRunsCount = validationRes.count ?? 0;
    const isGuest = !profile?.email;

    let userContext = `\n\n## CURRENT USER CONTEXT\n`;
    userContext += `- Name: ${profile?.display_name || "Unknown"}\n`;
    userContext += `- Account: ${isGuest ? "Guest (not signed up)" : "Registered"}\n`;
    userContext += `- Credits: ${profile?.credits ?? "?"} / ${profile?.max_credits ?? "?"}\n`;
    userContext += `- Saved ideas: ${savedIdeasCount} | Generate runs: ${generatorRunsCount} | Validate runs: ${validationRunsCount}\n`;
    if (isGuest) userContext += `\nGuest user — gently suggest signing up when relevant.\n`;
    if ((profile?.credits ?? 0) <= 1) userContext += `\nLow credits — be mindful of suggesting credit-consuming actions.\n`;
    if (savedIdeasCount === 0 && generatorRunsCount > 0) userContext += `\nHas run research but hasn't saved ideas — remind about My Ideas when relevant.\n`;

    const startTime = Date.now();
    const { messages } = await req.json();

    // ─── Smart Model Routing ───
    const complexity = classifyQuery(messages);
    const model = complexity === "complex" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";
    console.log(`Query complexity: ${complexity} → Model: ${model}`);

    // ─── Research Grounding ───
    const researchQuery = needsWebResearch(messages);
    let researchContext = "";
    if (researchQuery) {
      console.log("Triggering web research for:", researchQuery);
      const webData = await searchWeb(researchQuery);
      if (webData) {
        researchContext = `\n\n## WEB RESEARCH CONTEXT (from live search — use this data in your response, cite sources)\n${webData}`;
      }
    }

    // ─── Call Lovable AI Gateway ───
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + userContext + researchContext },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
        temperature: complexity === "complex" ? 0.5 : 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errBody);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error [${response.status}]`);
    }

    // Log success
    serviceClient.from("request_logs").insert({
      user_id: userId, function_name: "orbis-chat", status: "success",
      latency_ms: Date.now() - startTime, provider: model,
    }).then(() => {});

    // Stream response back (already OpenAI-compatible SSE from gateway)
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("orbis-chat error:", e);
    try {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await svc.from("request_logs").insert({
        user_id: "unknown", function_name: "orbis-chat", status: "error",
        latency_ms: 0, error_type: "api_error", error_message: (e.message || "").slice(0, 500),
      });
    } catch {}
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
