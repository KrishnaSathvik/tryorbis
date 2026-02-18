import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth check ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    // ─── Rate limiting (10 req/min) ───
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: allowed } = await serviceClient.rpc('check_rate_limit', {
      p_user_id: userId, p_function_name: 'perplexity-generate',
    });
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();

    // ─── Server-side credit check & deduction ───
    const { data: deducted } = await supabaseClient.rpc('try_deduct_credit', { p_user_id: userId });
    if (!deducted) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('API key not configured');

    const body = await req.json();
    const { persona, category, region, platform, context } = body;

    // Input validation
    if (!persona || typeof persona !== 'string' || persona.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid or missing 'persona' (max 200 chars)" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!category || typeof category !== 'string' || category.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid or missing 'category' (max 200 chars)" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── SINGLE PASS: Research + Structured Analysis with sonar-pro ───
    const prompt = `You are a senior product strategist and market research analyst. Research real complaints and frustrations from "${persona}" in the "${category}" space${region ? ` in ${region}` : ''}${platform ? ` on ${platform}` : ''}.
${context ? `\nAdditional context: "${context}"` : ''}

RESEARCH these sources systematically:
1. **Reddit**: r/startups, r/SaaS, r/smallbusiness, niche subreddits — find high-upvote frustration posts
2. **Review sites**: G2, Capterra, Trustpilot — 1-3 star reviews of existing tools
3. **Twitter/X**: Complaints like "I hate [tool]", "why is [category] so hard"
4. **Forums**: Hacker News, Indie Hackers, specialized communities
5. **App stores**: Negative Play Store / App Store reviews if mobile-relevant

For each complaint: quote actual words, note the source, estimate how many share this frustration.

ALSO RESEARCH:
- **Willingness-to-pay**: "what tools do you pay for", "I'd pay $X for...", pricing complaints, budget discussions
- **Market timing**: Google Trends, recent VC funding, new regulations, recent Product Hunt/YC launches
- **Workarounds**: Spreadsheets, scripts, Zapier workflows, "we built our own" mentions
- **Feature gaps**: "I wish [tool] had...", features that would make users switch
- **Platform risks**: Major platforms building similar, API deprecations, regulation changes
- **GTM channels**: How competitors acquire customers, organic discussion channels
- **Pricing benchmarks**: Exact pricing of ALL competitors found
- **Defensibility**: Network effects, integration ecosystems, switching costs, data moats
- **Existing solutions**: Tools that exist, their complaints, pricing, gaps, competitor funding

Then analyze and produce structured output.

CLUSTERING RULES:
- Group complaints into 4-6 distinct thematic clusters
- Each cluster needs at least 3 real complaints as evidence
- Rank by severity × frequency (most painful + common first)
- "complaintCount" = estimated people affected (based on engagement — be realistic)
- Use ACTUAL quotes from research — never fabricate

IDEA GENERATION:
- Generate 4-6 product ideas solving discovered problems
- Each idea links to a specific problem cluster
- Names: unique, memorable, brandable (2-3 words max, like "Loom", "Notion") — NEVER generic
- Each name should sound like a real Product Hunt product

DEMAND SCORING (be strict):
- 85-95: Massive demand, thousands of complaints, no good solution
- 70-84: Strong signals, hundreds of complaints, clear gaps in existing solutions
- 55-69: Moderate signals, dozens of complaints, some imperfect solutions
- 40-54: Weak signals, few complaints, decent solutions available
- Below 40: Minimal evidence

WTP: Rate strength as "strong"/"moderate"/"weak"/"none"
COMPETITION: Classify as "blue_ocean"/"fragmented"/"crowded"/"winner_take_most"
MARKET TIMING: Classify as "emerging"/"growing"/"saturated"/"declining"
WORKAROUNDS: Rate severity as "strong"/"moderate"/"weak"/"none"
PLATFORM RISK: Level as "low"/"medium"/"high"/"critical"
GTM: Rate channel viability as "high"/"medium"/"low"
DEFENSIBILITY: Overall strength as "strong"/"moderate"/"weak"/"none"

Return ONLY valid JSON with this structure:
{
  "problemClusters": [
    {
      "id": "cluster_1",
      "theme": "Clear theme name",
      "painSummary": "1-2 sentence summary",
      "complaintCount": 150,
      "evidenceLinks": ["url1"],
      "complaints": ["Quote 1", "Quote 2", "Quote 3"]
    }
  ],
  "ideaSuggestions": [
    {
      "id": "idea_1",
      "clusterId": "cluster_1",
      "name": "BrandName",
      "description": "What it does",
      "mvpScope": "Smallest version",
      "monetization": "Pricing model",
      "demandScore": 72
    }
  ],
  "wtpSignals": {
    "strength": "strong",
    "signals": [{"quote": "Quote", "source": "Source", "context": "Context"}],
    "priceRange": {"low": 19, "mid": 49, "high": 99, "currency": "USD/mo"},
    "summary": "Summary"
  },
  "competitionDensity": {
    "level": "fragmented",
    "competitorCount": 8,
    "totalFundingEstimate": "$45M",
    "keyIncumbents": ["Competitor A"],
    "switchingCosts": "low",
    "summary": "Summary"
  },
  "marketTiming": {
    "phase": "growing",
    "signals": ["Signal"],
    "summary": "Summary"
  },
  "icp": {
    "businessType": "B2B SaaS",
    "companySize": "10-50",
    "revenueRange": "$500K-$5M",
    "industry": "SaaS",
    "techStack": ["Stripe"],
    "buyingTriggers": ["Trigger"],
    "budgetRange": "$30-100/mo",
    "summary": "Summary"
  },
  "workaroundDetection": {
    "severity": "strong",
    "workarounds": [{"description": "Desc", "source": "Source", "investmentLevel": "high"}],
    "summary": "Summary"
  },
  "featureGapMap": {
    "gaps": [{"feature": "Feature", "competitorCoverage": "weak", "opportunity": "high"}],
    "topWedge": "Best entry feature",
    "summary": "Summary"
  },
  "platformRisk": {
    "level": "medium",
    "signals": [{"signal": "Signal", "riskType": "bundling"}],
    "summary": "Summary"
  },
  "gtmStrategy": {
    "primaryChannel": "Content marketing + SEO",
    "channels": [
      {"channel": "Content / SEO", "viability": "high", "reasoning": "Reason"},
      {"channel": "Communities", "viability": "medium", "reasoning": "Reason"}
    ],
    "founderLedSales": true,
    "seoViability": "strong",
    "summary": "Summary"
  },
  "pricingBenchmarks": {
    "benchmarks": [
      {"tool": "Competitor A", "price": "$49/mo", "model": "per-seat", "notes": "Note"}
    ],
    "suggestedRange": {"low": "$19/mo", "mid": "$39/mo", "high": "$79/mo"},
    "pricingModel": "Flat-rate",
    "summary": "Summary"
  },
  "defensibility": {
    "overallStrength": "moderate",
    "signals": [
      {"type": "data_network", "description": "Description", "strength": "moderate"}
    ],
    "timeToMoat": "12-18 months",
    "summary": "Summary"
  }
}`;

    console.log('Starting single-pass research + analysis with sonar-pro...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a meticulous market research analyst and product strategist. Research real, specific, verifiable data from the web. Then analyze and return structured JSON. Be thorough and honest — never inflate scores or fabricate evidence. Always cite sources.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Perplexity error:', response.status, errBody);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`API error [${response.status}]`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    console.log(`Response: ${content.length} chars, ${citations.length} citations`);

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { problemClusters: [], ideaSuggestions: [] };
    } catch {
      console.error('Failed to parse output, raw:', content.slice(0, 500));
      parsed = { problemClusters: [], ideaSuggestions: [] };
    }

    // Ensure citations are distributed to clusters
    if (citations.length > 0 && parsed.problemClusters?.length > 0) {
      const citationsPerCluster = Math.max(1, Math.floor(citations.length / parsed.problemClusters.length));
      parsed.problemClusters.forEach((cluster: any, i: number) => {
        if (!cluster.evidenceLinks || cluster.evidenceLinks.length === 0) {
          cluster.evidenceLinks = citations.slice(i * citationsPerCluster, (i + 1) * citationsPerCluster);
        }
      });
    }

    parsed.evidenceLinks = citations;

    console.log(`Complete: ${parsed.problemClusters?.length || 0} clusters, ${parsed.ideaSuggestions?.length || 0} ideas, WTP: ${parsed.wtpSignals?.strength || 'none'}, Competition: ${parsed.competitionDensity?.level || 'unknown'}, Timing: ${parsed.marketTiming?.phase || 'unknown'}`);

    // ─── Log success ───
    await serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'perplexity-generate', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'perplexity-sonar-pro',
    });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-generate error:', error);
    try {
      const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await svc.from('request_logs').insert({
        user_id: 'unknown', function_name: 'perplexity-generate', status: 'error',
        latency_ms: 0, error_type: 'api_error', error_message: (error.message || '').slice(0, 500),
      });
    } catch {}
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
