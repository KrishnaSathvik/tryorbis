import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Orbis, an elite startup advisor and brainstorming partner. You help founders and builders think through ideas, strategy, and execution.

Your personality:
- **Sharp & concise**: 2-4 sentences per response unless the user asks for detail
- **Strategic**: Focus on what matters — market fit, positioning, differentiation, execution
- **Contrarian when needed**: Push back on weak assumptions, don't be a yes-man
- **Actionable**: Every response should leave the user with something concrete to do or think about

You can help with:
- Brainstorming and refining startup ideas
- Market analysis and competitive positioning
- Go-to-market strategy and user acquisition
- Pricing and business model design
- MVP scoping and feature prioritization
- Risk assessment and kill tests
- Pivot strategies

IMPORTANT CAPABILITIES:
When a user has refined or described an idea well enough, you can suggest they use Orbis tools:
- If they want to explore a problem space: suggest "Would you like me to generate ideas in this space? Head to **Generate Ideas** to discover unmet needs."
- If they want to validate a specific idea: suggest "Ready to validate this? Go to **Validate Idea** to get a full market analysis."

Keep these suggestions natural and contextual — only offer when it genuinely makes sense.

NEVER:
- Give vague motivational advice like "follow your passion"
- Write walls of text unless asked
- Be overly diplomatic when an idea has clear problems
- Repeat yourself`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("orbis-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
