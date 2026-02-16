import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

    const { ideaText } = await req.json();

    const systemPrompt = `You are a startup idea validator. Analyze the given idea for market demand, pain severity, competition, and feasibility. Return structured JSON.`;

    const userPrompt = `Validate this startup/product idea: "${ideaText}"

Research real market data: demand signals, existing competitors, pricing, gaps, and feasibility.

Return ONLY valid JSON in this exact format:
{
  "scores": {
    "demand": 72,
    "pain": 65,
    "competition": 55,
    "mvpFeasibility": 80
  },
  "verdict": "Build",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "gapOpportunities": ["Gap 1", "Gap 2"],
  "mvpWedge": "The smallest version you could build to test this",
  "killTest": "What evidence would disprove this idea",
  "competitors": [
    {"name": "Competitor Name", "weakness": "Their weakness", "pricing": "$X/mo"}
  ],
  "evidenceLinks": []
}

Scores should be 0-100. Verdict must be exactly "Build", "Pivot", or "Skip".
- Build: demand ≥60, pain ≥50, competition <70, feasibility ≥60
- Skip: demand <40 or pain <30
- Pivot: everything else`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Perplexity API error [${response.status}]: ${errBody}`);
    }

    const apiData = await response.json();
    const content = apiData.choices?.[0]?.message?.content || '';
    const citations = apiData.citations || [];

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    // Inject citations
    parsed.evidenceLinks = citations;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-validate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
