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
      p_user_id: userId, p_function_name: 'perplexity-validate',
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
    const { ideaText } = body;

    // Input validation
    if (!ideaText || typeof ideaText !== 'string' || ideaText.length > 1000) {
      return new Response(JSON.stringify({ error: `Invalid or missing 'ideaText' (max 1000 chars)` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── SINGLE PASS: Research + Validation with sonar-pro ───
    const prompt = `You are a brutally honest startup advisor and market research analyst. Validate this idea: "${ideaText}"

RESEARCH these areas systematically using real web data:

1. **DEMAND SIGNALS**: Reddit, Twitter, forums for "I wish...", "why doesn't X exist" posts. Google Trends. Product Hunt launches.
2. **COMPETITOR ANALYSIS**: Direct & indirect competitors. For EACH: name, what they do, pricing, weakest reviews, market position. Check G2, Capterra, Trustpilot.
3. **PAIN SEVERITY**: How painful? How often? What workarounds exist? Time/money cost?
4. **FEASIBILITY**: Technology needed, existing APIs/frameworks, realistic MVP scope.
5. **MARKET SIZE**: Target audience size, adjacent markets, growth trends.
6. **WILLINGNESS-TO-PAY**: "I'd pay $X", pricing complaints, budget discussions, tool switching reasons.
7. **MARKET TIMING**: Google Trends trajectory, VC funding, regulations, recent launches.
8. **WORKAROUNDS**: Spreadsheets, scripts, Zapier, "we built our own" mentions + investment level.
9. **FEATURE GAPS**: "I wish [tool] had...", features that would make users switch.
10. **PLATFORM RISKS**: Platforms building similar, API deprecations, regulation changes.
11. **GTM CHANNELS**: How competitors acquire customers, organic discussion channels.
12. **PRICING BENCHMARKS**: Exact pricing of ALL competitors found.
13. **DEFENSIBILITY**: Network effects, integration ecosystems, switching costs, data moats.

Then analyze and score honestly.

SCORING RUBRIC (be strict, evidence-based):
**Demand (0-100):** 85-100: thousands searching, 70-84: hundreds expressing need, 50-69: dozens mentioning, 30-49: few mentions, 0-29: no evidence
**Pain (0-100):** 85-100: "nightmare"/"dealbreaker", 70-84: significant frustration, 50-69: annoying but tolerable, 30-49: minor, 0-29: not painful
**Competition (0-100, HIGHER = harder):** 85-100: well-funded incumbents with moats, 70-84: established players with room, 50-69: mediocre competitors, 30-49: few small tools, 0-29: almost none
**MVP Feasibility (0-100):** 85-100: 1-2 weeks MVP, 70-84: 2-4 weeks, 50-69: 1-2 months, 30-49: 3-6 months, 0-29: major challenges

VERDICT RULES (apply AFTER scoring):
- **Build**: demand ≥ 65 AND pain ≥ 55 AND competition < 75 AND feasibility ≥ 55
- **Pivot**: pain ≥ 45 but approach needs rethinking
- **Skip**: demand < 40 OR pain < 35 OR (competition ≥ 80 AND no differentiator)

Your verdict MUST be consistent with scores. If demand is 35, you cannot say "Build".

Return ONLY valid JSON:
{
  "scores": {"demand": 72, "pain": 65, "competition": 55, "mvpFeasibility": 80},
  "scoreJustifications": {"demand": "Why", "pain": "Why", "competition": "Why", "mvpFeasibility": "Why"},
  "marketSizing": {"tam": "TAM", "sam": "SAM", "som": "SOM", "methodology": "Method"},
  "verdict": "Build",
  "verdictReasoning": "Reasoning",
  "pros": ["Pro 1"],
  "cons": ["Con 1"],
  "gapOpportunities": ["Gap 1"],
  "mvpWedge": "MVP description",
  "killTest": "How to quickly validate/invalidate",
  "competitors": [{"name": "Name", "weakness": "Weakness", "pricing": "$X/mo"}],
  "wtpSignals": {
    "strength": "strong",
    "signals": [{"quote": "Quote", "source": "Source", "context": "Context"}],
    "priceRange": {"low": 19, "mid": 49, "high": 99, "currency": "USD/mo"},
    "summary": "Summary"
  },
  "competitionDensity": {
    "level": "fragmented", "competitorCount": 8, "totalFundingEstimate": "$45M",
    "keyIncumbents": ["A"], "switchingCosts": "low", "summary": "Summary"
  },
  "marketTiming": {"phase": "growing", "signals": ["Signal"], "summary": "Summary"},
  "icp": {
    "businessType": "B2B SaaS", "companySize": "10-50", "revenueRange": "$500K-$5M",
    "industry": "SaaS", "techStack": ["Stripe"], "buyingTriggers": ["Trigger"],
    "budgetRange": "$30-100/mo", "summary": "Summary"
  },
  "workaroundDetection": {
    "severity": "strong",
    "workarounds": [{"description": "Desc", "source": "Source", "investmentLevel": "high"}],
    "summary": "Summary"
  },
  "featureGapMap": {
    "gaps": [{"feature": "Feature", "competitorCoverage": "weak", "opportunity": "high"}],
    "topWedge": "Wedge", "summary": "Summary"
  },
  "platformRisk": {
    "level": "medium",
    "signals": [{"signal": "Signal", "riskType": "bundling"}],
    "summary": "Summary"
  },
  "gtmStrategy": {
    "primaryChannel": "Content marketing",
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

    console.log('Starting single-pass validation with sonar-pro...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a brutally honest startup advisor and market research analyst. Research real data from the web, then analyze and score ideas. Never be diplomatic at the expense of truth. Base every score on evidence. Return structured JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Perplexity error:', response.status, errBody);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait and try again." }), {
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
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      console.error('Failed to parse output:', content.slice(0, 500));
      parsed = {};
    }

    // ─── Verdict consistency check ───
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

    console.log(`Complete: Verdict=${parsed.verdict}, Demand=${scores.demand}, Pain=${scores.pain}, WTP=${parsed.wtpSignals?.strength || 'none'}, GTM=${parsed.gtmStrategy?.primaryChannel || 'none'}`);

    // ─── Log success ───
    await serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'perplexity-validate', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'perplexity-sonar-pro',
    });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('perplexity-validate error:', error);
    try {
      const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await svc.from('request_logs').insert({
        user_id: 'unknown', function_name: 'perplexity-validate', status: 'error',
        latency_ms: 0, error_type: 'api_error', error_message: (error.message || '').slice(0, 500),
      });
    } catch {}
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
