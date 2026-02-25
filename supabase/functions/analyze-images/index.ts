import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, context } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build multimodal content parts
    const parts: any[] = [
      {
        type: "text",
        text: `Analyze these images in the context of startup/product research. ${context || ""}
        
Extract and describe in detail:
- What product/service/company is shown (if any)
- Key features, pricing, positioning visible
- UI/UX patterns, design quality
- Any text content (headings, copy, pricing tiers)
- Target audience signals
- Strengths and weaknesses visible

Be factual and concise. Return a structured summary the research AI can use as context.`,
      },
    ];

    for (const img of images.slice(0, 3)) {
      parts.push({
        type: "image_url",
        image_url: { url: img },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a visual analysis assistant for startup research. Extract actionable details from screenshots and images.",
            },
            { role: "user", content: parts },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("AI gateway error:", response.status, errBody);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error [${response.status}]`);
    }

    const data = await response.json();
    const analysis =
      data.choices?.[0]?.message?.content || "Unable to analyze images.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("analyze-images error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to analyze images" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
