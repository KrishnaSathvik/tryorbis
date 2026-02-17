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
    const { ideaText } = body;

    // Input validation
    if (!ideaText || typeof ideaText !== 'string' || ideaText.length > 1000) {
      return new Response(JSON.stringify({ error: `Invalid or missing 'ideaText' (max 1000 chars)` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── PASS 1: Deep market research with Perplexity sonar-pro ───
    const researchPrompt = `Conduct thorough market research for this startup/product idea: "${ideaText}"

RESEARCH METHODOLOGY — investigate each area systematically:

1. **DEMAND SIGNALS**:
   - Search Reddit, Twitter, forums for people asking for this type of solution
   - Look for "I wish there was..." or "why doesn't X exist" posts
   - Check Google Trends data for related search terms
   - Look for related Product Hunt launches and their traction

2. **COMPETITOR ANALYSIS** (find ALL relevant competitors):
   - Direct competitors (same problem, same approach)
   - Indirect competitors (same problem, different approach)
   - Adjacent tools that could add this feature
   - For EACH competitor: name, what they do, pricing, their weakest reviews, market position
   - Check G2, Capterra, Trustpilot for their ratings and common complaints

3. **PAIN SEVERITY**:
   - How painful is this problem? How often do people encounter it?
   - What do people currently do as workarounds?
   - How much time/money does this problem cost?

4. **FEASIBILITY INDICATORS**:
   - What technology would be needed?
   - Are there existing APIs, open-source tools, or frameworks that make this easier?
   - What would a realistic MVP look like?

5. **MARKET SIZE INDICATORS**:
   - How large is the target audience?
   - What adjacent markets exist?
   - Are there growing trends supporting this idea?

6. **WILLINGNESS-TO-PAY SIGNALS** (CRITICAL):
   - Search for "what tools do you pay for" related to this problem
   - Find "I'd pay $X for..." or "too expensive at $X" statements
   - Look for pricing complaints about existing tools
   - Find budget discussions, tool switching reasons with price context
   - Search "alternatives to [popular tool] pricing"
   - Quote actual WTP statements with source

7. **MARKET TIMING INDICATORS**:
   - Google Trends trajectory for related search terms
   - Recent VC funding rounds in this space (Crunchbase)
   - New regulations or platform changes affecting this space
   - Recent Product Hunt / YC companies in this category
   - Technology enablers that are newly available

8. **WORKAROUND DETECTION** (Phase 2 — new):
   - Search for manual solutions: spreadsheets, scripts, Zapier, internal tools
   - Look for "we built our own", "I hacked together", "using spreadsheets"
   - Note time/money investment in these workarounds
   - These prove pain is real AND budget exists

9. **FEATURE GAP ANALYSIS** (Phase 2 — new):
   - For each competitor: which features they do well vs poorly
   - "I wish [tool] had..." or "the one thing missing" posts
   - Which features are commoditized vs differentiation opportunities
   - Features that would make users switch tools

10. **PLATFORM RISK SIGNALS** (Phase 2 — new):
    - Major platforms building or announcing similar features
    - API deprecation notices or rate-limit changes
    - New regulations that could restrict or enable this category
    - Platform dependency risks (single API reliance)

Return your findings as detailed unstructured text with all data points, quotes, competitor names, pricing, WTP signals, timing data, workarounds, feature gaps, platform risks, URLs. Do NOT format as JSON — give me the raw research.`;

    console.log('Pass 1: Deep market research with sonar-pro...');
    const researchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a meticulous market research analyst specializing in startup validation. Find real, verifiable data — not assumptions. Cite sources. Be thorough and specific with numbers, pricing, willingness-to-pay signals, workaround evidence, feature gaps, platform risks, and competitor details.' },
          { role: 'user', content: researchPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!researchResponse.ok) {
      const errBody = await researchResponse.text();
      console.error('Perplexity Pass 1 error:', researchResponse.status, errBody);
      if (researchResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Research rate limit reached. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Research API error [${researchResponse.status}]`);
    }

    const researchData = await researchResponse.json();
    const rawResearch = researchData.choices?.[0]?.message?.content || '';
    const citations = researchData.citations || [];
    console.log(`Pass 1 complete: ${rawResearch.length} chars, ${citations.length} citations`);

    // ─── PASS 2: Analysis, scoring & verdict with Gemini Pro ───
    const analysisPrompt = `You are a senior startup advisor analyzing real market research to validate this idea: "${ideaText}"

RAW RESEARCH DATA:
${rawResearch}

CITATIONS/SOURCES:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

SCORING RUBRIC — be strict and evidence-based:

**Demand Score (0-100):**
- 85-100: Thousands of people actively searching for this, multiple "I wish this existed" posts with 100+ upvotes, growing search trends
- 70-84: Hundreds of people expressing need, some "wish it existed" posts, stable or growing interest
- 50-69: Dozens of people mentioning the problem, but not urgently seeking solutions
- 30-49: Few mentions, problem exists but people cope fine with workarounds
- 0-29: Almost no evidence of demand

**Pain Score (0-100):**
- 85-100: People describe the problem as "nightmare", "dealbreaker", lose hours/week or $1000+/mo to it
- 70-84: Significant frustration, frequent complaints, costs meaningful time/money
- 50-69: Annoying but tolerable, occasional complaints
- 30-49: Minor inconvenience, rarely mentioned as a real problem
- 0-29: Not really painful

**Competition Score (0-100)** (HIGHER = MORE competitive = HARDER to enter):
- 85-100: Dominated by well-funded incumbents (>$50M raised), strong network effects, high switching costs
- 70-84: Several established competitors, but none dominant — room for differentiation
- 50-69: Some competitors exist but they're mediocre or serving adjacent markets
- 30-49: Few competitors, mostly small/indie tools with clear gaps
- 0-29: Almost no competition (rare — be suspicious if you score this low)

**MVP Feasibility Score (0-100):**
- 85-100: Could build a working MVP in 1-2 weeks with existing APIs/tools, solo developer feasible
- 70-84: 2-4 weeks for MVP, needs some custom logic but no deep tech
- 50-69: 1-2 months, requires meaningful engineering or specialized knowledge
- 30-49: 3-6 months, needs team or specialized expertise
- 0-29: Major technical challenges, regulatory hurdles, or requires massive scale to work

VERDICT RULES — apply AFTER scoring, based on the evidence:
- **Build**: demand ≥ 65 AND pain ≥ 55 AND competition < 75 AND feasibility ≥ 55. Strong evidence that people want this and you can build it.
- **Pivot**: The core problem is real (pain ≥ 45) but the specific approach needs rethinking — either too competitive, not enough demand for THIS solution, or feasibility concerns. Suggest what to pivot toward.
- **Skip**: demand < 40 OR pain < 35 OR (competition ≥ 80 AND no clear differentiator). Not enough evidence to justify building.

IMPORTANT: Your verdict MUST be consistent with your scores. If demand is 35, you cannot say "Build". Explain your reasoning.

WILLINGNESS-TO-PAY EXTRACTION (NEW — CRITICAL):
Extract real WTP signals from the research. Look for:
- Direct price mentions ("I'd pay $X for this")
- Pricing complaints about existing tools ("too expensive at $X/mo")
- Budget discussions and tool switching due to price
- Workaround investment (time/money spent on manual alternatives)
Rate the overall WTP signal strength: "strong", "moderate", "weak", or "none"

COMPETITION DENSITY ANALYSIS (NEW):
Classify the competitive landscape beyond just a score:
- "blue_ocean": Almost no competitors, wide open space
- "fragmented": Several small players, no dominant leader
- "crowded": Many competitors but room for differentiation
- "winner_take_most": Dominated by 1-2 incumbents with network effects
Include: number of competitors, total funding estimate, switching costs

MARKET TIMING ASSESSMENT (NEW):
Classify market timing:
- "emerging": New category, early signals, few players
- "growing": Category expanding, VC interest rising, search trends up
- "saturated": Mature market, many players, innovation slowing
- "declining": Interest waning, consolidation happening

ICP (IDEAL CUSTOMER PROFILE) EXTRACTION:
Define the ideal first customer:
- Business type (B2B/B2C/B2B2C)
- Company size / revenue range
- Industry vertical
- Current tech stack indicators
- Key buying triggers
- Budget range

WORKAROUND DETECTION (Phase 2 — NEW):
Extract workaround evidence:
- Manual processes (spreadsheets, scripts, Zapier, internal tools)
- Time/money investment level per workaround: "low", "medium", "high"
- Overall severity: "strong" (many high-investment workarounds), "moderate", "weak", "none"

FEATURE GAP MAPPING (Phase 2 — NEW):
Build feature gap matrix:
- 4-8 key features for this space
- Competitor coverage: "none", "weak", "strong", "commodity"
- Opportunity: "high", "medium", "low"
- Identify single best "top wedge" feature to enter market

PLATFORM RISK SCORING (Phase 2 — NEW):
Assess platform dependency:
- Level: "low", "medium", "high", "critical"
- Signal types: "bundling", "api_limitation", "roadmap_overlap", "regulation", "dependency"

Return ONLY valid JSON:
{
  "scores": {
    "demand": 72,
    "pain": 65,
    "competition": 55,
    "mvpFeasibility": 80
  },
  "scoreJustifications": {
    "demand": "Why this score",
    "pain": "Why this score",
    "competition": "Why this score",
    "mvpFeasibility": "Why this score"
  },
  "marketSizing": {
    "tam": "Total Addressable Market estimate",
    "sam": "Serviceable Addressable Market",
    "som": "Serviceable Obtainable Market",
    "methodology": "Brief explanation"
  },
  "verdict": "Build",
  "verdictReasoning": "2-3 sentences",
  "pros": ["Pro 1", "Pro 2"],
  "cons": ["Con 1", "Con 2"],
  "gapOpportunities": ["Gap 1", "Gap 2"],
  "mvpWedge": "Smallest version to build first",
  "killTest": "Most important thing to test",
  "competitors": [
    {"name": "Real Competitor", "weakness": "Specific weakness", "pricing": "$X/mo"}
  ],
  "wtpSignals": {
    "strength": "strong",
    "signals": [{"quote": "I'd pay $50/mo", "source": "Reddit", "context": "Context"}],
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
    "signals": ["Signal 1"],
    "summary": "Summary"
  },
  "icp": {
    "businessType": "B2B SaaS",
    "companySize": "10-50 employees",
    "revenueRange": "$500K-$5M ARR",
    "industry": "SaaS",
    "techStack": ["Stripe"],
    "buyingTriggers": ["Trigger 1"],
    "budgetRange": "$30-100/mo",
    "summary": "Summary"
  },
  "workaroundDetection": {
    "severity": "strong",
    "workarounds": [
      {"description": "Custom spreadsheets for tracking", "source": "Reddit", "investmentLevel": "high"}
    ],
    "summary": "Strong workaround signals"
  },
  "featureGapMap": {
    "gaps": [
      {"feature": "Exit surveys", "competitorCoverage": "weak", "opportunity": "high"}
    ],
    "topWedge": "Best entry feature",
    "summary": "Key gaps identified"
  },
  "platformRisk": {
    "level": "medium",
    "signals": [
      {"signal": "Platform launching similar features", "riskType": "bundling"}
    ],
    "summary": "Risk assessment"
  }
}`;

    console.log('Pass 2: Analysis with Gemini...');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('API key not configured');

    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: 'You are a brutally honest startup advisor. Your job is to save founders from wasting time on bad ideas AND to greenlight genuinely promising ones. Never be diplomatic at the expense of truth. Base every score and statement on the research evidence provided. Extract willingness-to-pay signals, competition density, market timing, ICP, workaround evidence, feature gaps, and platform risks from the data.\n\n' + analysisPrompt }] },
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
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      console.error('Failed to parse output:', analysisContent.slice(0, 500));
      parsed = {};
    }

    // ─── PASS 3: Verdict consistency check ───
    const scores = parsed.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
    const verdict = parsed.verdict;
    
    let correctedVerdict = verdict;
    if (verdict === 'Build' && (scores.demand < 65 || scores.pain < 55 || scores.competition >= 75 || scores.mvpFeasibility < 55)) {
      correctedVerdict = 'Pivot';
      parsed.verdictReasoning = `[Auto-corrected from Build to Pivot] Scores don't meet Build threshold. ${parsed.verdictReasoning || ''}`;
    }
    if (verdict === 'Build' && (scores.demand < 40 || scores.pain < 35)) {
      correctedVerdict = 'Skip';
      parsed.verdictReasoning = `[Auto-corrected from Build to Skip] Insufficient demand/pain evidence. ${parsed.verdictReasoning || ''}`;
    }
    if (verdict === 'Skip' && scores.demand >= 65 && scores.pain >= 55 && scores.competition < 75 && scores.mvpFeasibility >= 55) {
      correctedVerdict = 'Build';
      parsed.verdictReasoning = `[Auto-corrected from Skip to Build] Scores actually meet Build threshold. ${parsed.verdictReasoning || ''}`;
    }
    parsed.verdict = correctedVerdict;

    // Inject citations
    parsed.evidenceLinks = citations;

    console.log(`Complete: Verdict=${parsed.verdict}, Demand=${scores.demand}, Pain=${scores.pain}, WTP=${parsed.wtpSignals?.strength || 'none'}, Timing=${parsed.marketTiming?.phase || 'unknown'}, Workarounds=${parsed.workaroundDetection?.severity || 'none'}, Gaps=${parsed.featureGapMap?.gaps?.length || 0}, PlatformRisk=${parsed.platformRisk?.level || 'unknown'}`);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-validate error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
