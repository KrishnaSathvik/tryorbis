import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { persona, category, region, platform, context } = await req.json();

    // ─── PASS 1: Deep web research with Perplexity sonar-pro ───
    const searchPrompt = `Research real, specific complaints and frustrations from "${persona}" in the "${category}" space${region ? ` in ${region}` : ''}${platform ? ` on ${platform}` : ''}.
${context ? `\nAdditional context from user: "${context}"` : ''}

RESEARCH METHODOLOGY — search these sources systematically:
1. **Reddit**: Search r/startups, r/SaaS, r/smallbusiness, and niche subreddits for "${category}" complaints. Look for posts with high upvotes expressing frustration.
2. **Product review sites**: G2, Capterra, Trustpilot — look for 1-3 star reviews of existing tools in this space.
3. **Twitter/X**: Search for complaints like "I hate [tool]", "why is [category] so hard", frustrated tweets from ${persona}.
4. **Forums & communities**: Hacker News, Indie Hackers, specialized Discord/Slack communities.
5. **App store reviews**: If mobile-relevant, check negative Play Store / App Store reviews.

For EACH complaint or pain point you find:
- Quote the actual words people used (paraphrase if needed)
- Note WHERE you found it (which platform/source)
- Estimate how many people share this frustration based on engagement (upvotes, replies, similar posts)

Find at least 15-25 distinct complaints. Group them into 4-6 thematic clusters.

Also research existing solutions in this space:
- What tools already exist?
- What are their most common complaints?
- What pricing do they charge?
- What gaps do users mention?

Return your findings as detailed, unstructured text. Include all quotes, sources, competitor names, and data points. Do NOT structure as JSON yet — just give me the raw research.`;

    console.log('Pass 1: Starting deep research with sonar-pro...');
    const researchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a meticulous market research analyst. Find real, specific, verifiable complaints and pain points. Always cite where you found information. Be thorough — quality and specificity matter more than speed.' },
          { role: 'user', content: searchPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!researchResponse.ok) {
      const errBody = await researchResponse.text();
      console.error('Perplexity Pass 1 error:', researchResponse.status, errBody);
      if (researchResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Research rate limit reached. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Perplexity API error [${researchResponse.status}]`);
    }

    const researchData = await researchResponse.json();
    const rawResearch = researchData.choices?.[0]?.message?.content || '';
    const citations = researchData.citations || [];
    console.log(`Pass 1 complete: ${rawResearch.length} chars, ${citations.length} citations`);

    // ─── PASS 2: Analysis & structuring with Gemini Pro ───
    const analysisPrompt = `You are a product strategist analyzing raw market research. Below is real research data about complaints and pain points from "${persona}" in "${category}".
${context ? `User's original context: "${context}"` : ''}

RAW RESEARCH DATA:
${rawResearch}

CITATIONS/SOURCES:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

YOUR TASK: Analyze this research and produce structured output.

CLUSTERING RULES:
- Group complaints into 4-6 distinct thematic clusters
- Each cluster must have at least 3 real complaints as evidence
- Rank clusters by severity × frequency (most painful + most common first)
- "complaintCount" = estimated number of people affected (based on upvotes, replies, similar posts — be realistic, don't inflate)
- Use ACTUAL quotes or close paraphrases from the research — never make up complaints

IDEA GENERATION RULES:
- Generate 4-6 product ideas that solve the discovered problems
- Each idea MUST link to a specific problem cluster
- Names must be unique, memorable, and brandable (2-3 words max, like "Loom", "Notion", "Canva") — NEVER generic descriptions
- Each name must sound like a real product you'd find on Product Hunt

DEMAND SCORING RUBRIC (be strict and honest):
- 85-95: Multiple sources confirm massive demand, thousands of complaints, no good solution exists
- 70-84: Strong signals from multiple sources, hundreds of complaints, existing solutions have clear gaps
- 55-69: Moderate signals, dozens of complaints, some solutions exist but imperfect
- 40-54: Weak signals, few complaints, decent solutions already available
- Below 40: Minimal evidence of demand

Return ONLY valid JSON:
{
  "problemClusters": [
    {
      "id": "cluster_1",
      "theme": "Clear theme name",
      "painSummary": "1-2 sentence summary of the core frustration",
      "complaintCount": 150,
      "evidenceLinks": ["url1", "url2"],
      "complaints": ["Actual quote 1", "Actual quote 2", "Actual quote 3"]
    }
  ],
  "ideaSuggestions": [
    {
      "id": "idea_1",
      "clusterId": "cluster_1",
      "name": "BrandName",
      "description": "What it does and why it's different from existing solutions",
      "mvpScope": "The absolute smallest version you could build in 2-4 weeks to test demand",
      "monetization": "Specific pricing model with price points (e.g., 'Freemium: free tier + $19/mo pro')",
      "demandScore": 72
    }
  ]
}`;

    console.log('Pass 2: Analyzing with Gemini Pro...');
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a senior product strategist. Analyze research data and produce precise, honest, structured analysis. Never inflate scores or fabricate evidence. Be brutally honest about demand levels.' },
          { role: 'user', content: analysisPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!analysisResponse.ok) {
      const errBody = await analysisResponse.text();
      console.error('Gemini Pass 2 error:', analysisResponse.status, errBody);
      if (analysisResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Analysis rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error [${analysisResponse.status}]`);
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { problemClusters: [], ideaSuggestions: [] };
    } catch {
      console.error('Failed to parse Gemini output, raw:', analysisContent.slice(0, 500));
      parsed = { problemClusters: [], ideaSuggestions: [] };
    }

    // Ensure citations are properly distributed
    if (citations.length > 0 && parsed.problemClusters) {
      const citationsPerCluster = Math.max(1, Math.floor(citations.length / parsed.problemClusters.length));
      parsed.problemClusters.forEach((cluster: any, i: number) => {
        if (!cluster.evidenceLinks || cluster.evidenceLinks.length === 0) {
          cluster.evidenceLinks = citations.slice(i * citationsPerCluster, (i + 1) * citationsPerCluster);
        }
      });
    }

    console.log(`Complete: ${parsed.problemClusters?.length || 0} clusters, ${parsed.ideaSuggestions?.length || 0} ideas`);

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
