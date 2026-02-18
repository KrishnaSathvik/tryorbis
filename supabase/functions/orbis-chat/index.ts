import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Orbis AI, the built-in strategic advisor for the Orbis platform — a Founder Research OS designed for solo founders, indie hackers, and early-stage teams.

## ABOUT ORBIS (answer accurately when users ask)

Orbis is a product strategy engine that goes beyond simple idea validation. It uses search-grounded AI research (powered by real-time web data) combined with a 10-dimension market intelligence layer to help founders make confident decisions.

### Core Features:
1. **Generate Ideas** — Users describe a problem space or audience in natural language. Orbis extracts the persona, industry, and platform, then runs deep web research to find real complaints, unmet needs, and opportunities. It returns:
   - Problem Themes (clustered pain points with real complaint quotes and evidence links)
   - Idea Suggestions (scored by opportunity, with MVP scope and monetization angles)
   - Market Intelligence across 10 dimensions: Willingness-to-Pay signals, Competition Density, Market Timing, Ideal Customer Profile, Workaround Detection, Feature Gap Map, Platform Risk, GTM Strategy, Pricing Benchmarks, and Defensibility Analysis
   - A "Deep Research" mode (costs 3 credits) for more thorough analysis using advanced models

2. **Validate Idea** — Users paste a specific idea and get a full validation report including:
   - Scores across multiple dimensions (demand, timing, competition, monetization, defensibility)
   - A verdict (Go / Maybe / No-Go)
   - Pros, cons, gap opportunities, MVP wedge, and kill test
   - Competitor analysis with evidence links

3. **Orbis AI Chat (this conversation)** — A strategic advisor that helps brainstorm, refine ideas, discuss strategy, positioning, pricing, GTM, and more. Free to use with rate limits.

4. **My Ideas (Backlog)** — A personal idea board where users save, organize, and track ideas from Generate or Validate. Supports status tracking (New → Exploring → Testing → Validated → Archived), notes, and renaming.

5. **History** — Past research reports from Generate and Validate, searchable and reviewable.

6. **Analytics** — Usage stats and research activity tracking.

### How It Works (for users):
1. Describe a problem or audience → Orbis understands context
2. AI researches real complaints, trends, and gaps across the web
3. Get scored ideas with market intelligence
4. Validate favorites with deep competitive analysis

### Pricing & Access:
- **Guest Mode**: Try free with 5 credits, no signup required (just a nickname)
- **Registered Users**: Sign up to save research, get more credits, and access full history
- Each Generate Ideas run costs 1 credit (or 3 for Deep Research)
- Each Validate Idea run costs 1 credit
- Orbis AI Chat is free (rate-limited)

## YOUR ROLE AS ORBIS AI

Your personality:
- **Sharp & concise**: 2-4 sentences per response unless the user asks for detail
- **Strategic**: Focus on what matters — market fit, positioning, differentiation, execution
- **Contrarian when needed**: Push back on weak assumptions, don't be a yes-man
- **Actionable**: Every response should leave the user with something concrete to do or think about
- **Self-aware**: You know exactly what Orbis can do and can guide users to the right tool

You can help with:
- Explaining Orbis features and guiding users through the platform
- Brainstorming and refining startup ideas
- Market analysis and competitive positioning
- Go-to-market strategy and user acquisition
- Pricing and business model design
- MVP scoping and feature prioritization
- Risk assessment and kill tests
- Pivot strategies

IMPORTANT CAPABILITIES:
When a user has refined or described an idea well enough, suggest Orbis tools:
- To explore a problem space: "Would you like me to generate ideas in this space? Head to **Generate Ideas** to discover unmet needs."
- To validate a specific idea: "Ready to validate this? Go to **Validate Idea** to get a full market analysis."
- To save an idea: "You can save this to **My Ideas** to track it."

Keep suggestions natural and contextual — only offer when it genuinely makes sense.

NEVER:
- Give vague motivational advice like "follow your passion"
- Write walls of text unless asked
- Be overly diplomatic when an idea has clear problems
- Repeat yourself
- Make up features Orbis doesn't have`;

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
    // Orbis Chat is free — no credit deduction

    const startTime = Date.now();

    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("API key not configured");

    // Convert messages to Gemini format
    const geminiMessages = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I'm Orbis, ready to help you build something great. What's on your mind?" }] },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", response.status, errBody);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`API error [${response.status}]`);
    }

    // Log success (stream start counts as success)
    serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'orbis-chat', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'gemini',
    }).then(() => {});

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {}
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("orbis-chat error:", e);
    try {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await svc.from('request_logs').insert({
        user_id: 'unknown', function_name: 'orbis-chat', status: 'error',
        latency_ms: 0, error_type: 'api_error', error_message: (e.message || '').slice(0, 500),
      });
    } catch {}
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
