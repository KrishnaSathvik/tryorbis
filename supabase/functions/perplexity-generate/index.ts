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

WILLINGNESS-TO-PAY RESEARCH (CRITICAL — new):
- Search for "what tools do you pay for to solve ${category}" and "how much would you pay for ${category}"
- Look for pricing complaints: "too expensive", "overpriced", "I'd pay $X for..."
- Find budget discussions, tool switching reasons, and actual price points mentioned
- Search for "alternatives to [popular tool] pricing" in this space
- Quote actual WTP statements with source

MARKET TIMING RESEARCH (new):
- Check Google Trends for "${category}" related searches — is interest growing, stable, or declining?
- Look for recent VC funding in this space (Crunchbase, TechCrunch mentions)
- Check for new regulations, platform changes, or technology shifts affecting this space
- Note any recent Product Hunt launches or YC companies in this category

WORKAROUND DETECTION RESEARCH (Phase 2 — new):
- Search for manual solutions people have built: spreadsheets, scripts, Zapier workflows, internal tools
- Look for "we built our own", "I hacked together", "using a spreadsheet to track" mentions
- Note the investment level: how much time/money are people spending on workarounds?
- This proves the pain is real AND budget exists

FEATURE GAP RESEARCH (Phase 2 — new):
- For each competitor found, note which features they do well vs poorly
- Look for "I wish [tool] had..." or "the one thing missing from [tool]" posts
- Identify which features are commoditized (everyone has them) vs differentiation opportunities
- Note features that users explicitly say would make them switch tools

PLATFORM RISK RESEARCH (Phase 2 — new):
- Check if major platforms (Stripe, AWS, Shopify, etc.) are building or have announced similar features
- Look for API deprecation notices or rate-limit changes affecting this space
- Check for new regulations that could restrict or enable this category
- Note any platform dependency risks (e.g., relying on a single API that could change)

GTM STRATEGY RESEARCH (Phase 3 — new):
- How do existing competitors acquire customers? (SEO, paid ads, communities, marketplaces, partnerships)
- Look for founder stories about early customer acquisition in this space
- Check which channels have the most organic discussion about this problem
- Note if marketplace listings (Shopify App Store, Chrome Web Store, etc.) are viable

PRICING BENCHMARK RESEARCH (Phase 3 — new):
- Document exact pricing of ALL competitors found (free tier, paid tiers, enterprise pricing)
- Look for pricing comparison posts and "alternatives to X" discussions
- Note which pricing models are used (per-seat, usage-based, flat-rate, freemium)
- Find discussions about pricing fairness and value perception

DEFENSIBILITY / MOAT RESEARCH (Phase 3 — new):
- Look for network effects in this space (data moats, community flywheels)
- Check for integration ecosystems that create switching costs
- Identify technical moats (proprietary data, algorithms, patents)
- Note any regulatory barriers to entry or compliance moats

Also research existing solutions in this space:
- What tools already exist?
- What are their most common complaints?
- What pricing do they charge?
- What gaps do users mention?
- How many competitors exist and what's their funding level?

Return your findings as detailed, unstructured text. Include all quotes, sources, competitor names, pricing, WTP signals, timing data, workaround details, feature gaps, platform risks, GTM channels, pricing benchmarks, and moat signals. Do NOT structure as JSON yet — just give me the raw research.`;

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
          { role: 'system', content: 'You are a meticulous market research analyst. Find real, specific, verifiable complaints, willingness-to-pay signals, market timing indicators, workaround evidence, feature gaps, platform risks, GTM channels, pricing benchmarks, and moat signals. Always cite where you found information. Be thorough — quality and specificity matter more than speed.' },
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
      throw new Error(`Research API error [${researchResponse.status}]`);
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

YOUR TASK: Analyze this research and produce structured output with enhanced intelligence layers (Phase 1 + Phase 2 + Phase 3).

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

WILLINGNESS-TO-PAY EXTRACTION (NEW — CRITICAL):
Extract real WTP signals from the research. Look for:
- Direct price mentions ("I'd pay $X for this")
- Pricing complaints about existing tools ("too expensive at $X/mo")
- Budget discussions and tool switching due to price
- Workaround investment (time/money spent on manual alternatives)
Rate the overall WTP signal strength: "strong", "moderate", "weak", or "none"

COMPETITION DENSITY ANALYSIS (NEW):
Classify the competitive landscape:
- "blue_ocean": Almost no competitors, wide open space
- "fragmented": Several small players, no dominant leader
- "crowded": Many competitors but room for differentiation
- "winner_take_most": Dominated by 1-2 incumbents with network effects
Include: number of competitors found, total funding in space, key incumbents

MARKET TIMING ASSESSMENT (NEW):
Classify market timing:
- "emerging": New category, early signals, few players
- "growing": Category expanding, VC interest rising, search trends up
- "saturated": Mature market, many players, innovation slowing
- "declining": Interest waning, consolidation happening
Include timing signals from the research (trends, funding, regulations)

ICP (IDEAL CUSTOMER PROFILE) EXTRACTION:
Define the ideal first customer with specifics:
- Business type (B2B/B2C/B2B2C)
- Company size / revenue range
- Industry vertical
- Current tech stack indicators
- Key buying triggers
- Budget range

WORKAROUND DETECTION (Phase 2 — NEW):
Extract workaround evidence from the research:
- Manual processes people built (spreadsheets, scripts, Zapier, internal tools)
- Time/money investment in workarounds
- Classify investment level per workaround: "low" (minutes/week), "medium" (hours/week), "high" (days/week or $$$)
- Rate overall workaround severity: "strong" (many high-investment workarounds = validated pain), "moderate", "weak", "none"

FEATURE GAP MAPPING (Phase 2 — NEW):
Build a feature gap matrix from competitor analysis:
- List 4-8 key features relevant to this space
- For each: classify competitor coverage as "none", "weak", "strong", or "commodity"
- Rate opportunity: "high" (no coverage or weak = big gap), "medium", "low" (commodity = no differentiation)
- Identify the single best "top wedge" feature to enter the market with

PLATFORM RISK SCORING (Phase 2 — NEW):
Assess platform dependency risks:
- Level: "low", "medium", "high", or "critical"
- For each risk signal, classify type: "bundling", "api_limitation", "roadmap_overlap", "regulation", "dependency"

GTM STRATEGY ENGINE (Phase 3 — NEW):
Recommend go-to-market approach:
- Identify 3-5 acquisition channels with viability rating: "high", "medium", "low"
- Determine if founder-led sales is viable (boolean)
- Assess SEO viability: "strong", "moderate", "weak"
- Identify the single best primary channel to start with
- Consider: content marketing, communities, marketplaces, paid ads, partnerships, Product Hunt, outbound

PRICING BENCHMARK ANALYSIS (Phase 3 — NEW):
Not pricing suggestions — market benchmarks from research:
- List 3-6 competitor pricing with tool name, price, model (per-seat/usage/flat), and notes
- Suggest a price range (low/mid/high) based on market data
- Recommend pricing model based on what works in this space

DEFENSIBILITY / MOAT ANALYSIS (Phase 3 — NEW):
Assess long-term defensibility potential:
- Overall strength: "strong", "moderate", "weak", "none"
- For each moat signal, classify type: "data_network", "integrations", "lock_in", "community", "brand", "technical", "regulatory"
- Rate each signal's strength individually
- Estimate time to build meaningful moat (e.g., "6-12 months", "2+ years")

Return ONLY valid JSON:
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
    "workarounds": [{"description": "Description", "source": "Source", "investmentLevel": "high"}],
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
      {"channel": "Content / SEO", "viability": "high", "reasoning": "High search volume for this problem"},
      {"channel": "Product Hunt launch", "viability": "high", "reasoning": "Target audience active on PH"},
      {"channel": "Reddit communities", "viability": "medium", "reasoning": "Active discussions but anti-promotion"},
      {"channel": "Paid ads", "viability": "low", "reasoning": "High CPC in this space"}
    ],
    "founderLedSales": true,
    "seoViability": "strong",
    "summary": "Content-led growth with founder-led sales for early traction."
  },
  "pricingBenchmarks": {
    "benchmarks": [
      {"tool": "Competitor A", "price": "$49/mo", "model": "per-seat", "notes": "Most popular tier"},
      {"tool": "Competitor B", "price": "$29/mo", "model": "flat-rate", "notes": "Budget option"}
    ],
    "suggestedRange": {"low": "$19/mo", "mid": "$39/mo", "high": "$79/mo"},
    "pricingModel": "Flat-rate with usage limits — simplest for this market",
    "summary": "Market prices cluster around $30-50/mo. Flat-rate preferred."
  },
  "defensibility": {
    "overallStrength": "moderate",
    "signals": [
      {"type": "data_network", "description": "Usage data improves recommendations over time", "strength": "moderate"},
      {"type": "integrations", "description": "Deep Stripe integration creates switching costs", "strength": "strong"},
      {"type": "community", "description": "Potential for user community sharing templates", "strength": "weak"}
    ],
    "timeToMoat": "12-18 months",
    "summary": "Moderate defensibility via integrations and data accumulation."
  }
}`;

    console.log('Pass 2: Analyzing with Gemini...');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('API key not configured');

    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: 'You are a senior product strategist. Analyze research data and produce precise, honest, structured analysis. Never inflate scores or fabricate evidence. Be brutally honest about demand levels. Extract all intelligence layers: WTP, competition density, market timing, ICP, workarounds, feature gaps, platform risks, GTM strategy, pricing benchmarks, and defensibility/moat analysis.\n\n' + analysisPrompt }] },
        ],
        generationConfig: { temperature: 0.2 },
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
      throw new Error(`Analysis API error [${analysisResponse.status}]`);
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { problemClusters: [], ideaSuggestions: [] };
    } catch {
      console.error('Failed to parse output, raw:', analysisContent.slice(0, 500));
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

    // Inject citations into evidence
    parsed.evidenceLinks = citations;

    console.log(`Complete: ${parsed.problemClusters?.length || 0} clusters, ${parsed.ideaSuggestions?.length || 0} ideas, WTP: ${parsed.wtpSignals?.strength || 'none'}, Competition: ${parsed.competitionDensity?.level || 'unknown'}, Timing: ${parsed.marketTiming?.phase || 'unknown'}, Workarounds: ${parsed.workaroundDetection?.severity || 'none'}, GTM: ${parsed.gtmStrategy?.primaryChannel || 'none'}, Moat: ${parsed.defensibility?.overallStrength || 'unknown'}`);

    // ─── Log success ───
    await serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'perplexity-generate', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'perplexity+gemini',
    });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-generate error:', error);
    // ─── Log error ───
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
