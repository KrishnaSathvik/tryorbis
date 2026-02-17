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

    const { persona, category, region, platform } = await req.json();

    const systemPrompt = `You are a product research analyst. Find real problems, complaints, and unmet needs for the given persona and category. Return structured JSON.`;

    const userPrompt = `Research real complaints and frustrations from "${persona}" in the "${category}" space${region ? ` in ${region}` : ''}${platform ? ` for ${platform}` : ''}.

Find genuine pain points from Reddit, forums, Twitter, and review sites. Then generate product ideas to solve these problems.

Return ONLY valid JSON in this exact format:
{
  "problemClusters": [
    {
      "id": "cluster_1",
      "theme": "Theme name",
      "painSummary": "Brief summary of the pain point",
      "complaintCount": 15,
      "evidenceLinks": [],
      "complaints": ["Actual complaint excerpt 1", "Actual complaint excerpt 2"]
    }
  ],
  "ideaSuggestions": [
    {
      "id": "idea_1",
      "clusterId": "cluster_1",
      "name": "A short, catchy, brandable product name (2-3 words max, like 'Notion' or 'Stripe Atlas' — never generic descriptions)",
      "description": "What it does and why it helps",
      "mvpScope": "Smallest viable version to test",
      "monetization": "How to make money",
      "demandScore": 75
    }
  ]
}

Generate 3-5 problem clusters and 4-6 ideas. Demand scores should range 40-95 based on evidence strength.

IMPORTANT for idea names: Create unique, memorable, brandable product names (like "Loom", "Figma", "Airtable", "Canva"). Do NOT use generic descriptive names like "AI-powered invoicing tool" — instead create a proper brand name. Each name must be distinct and different from the others.`;

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

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { problemClusters: [], ideaSuggestions: [] };
    } catch {
      parsed = { problemClusters: [], ideaSuggestions: [] };
    }

    // Inject citations as evidence links
    if (citations.length > 0 && parsed.problemClusters) {
      parsed.problemClusters.forEach((cluster: any, i: number) => {
        cluster.evidenceLinks = citations.slice(i * 2, (i + 1) * 2);
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-generate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
