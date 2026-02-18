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

    // ─── Rate limiting ───
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

    if (!ideaText || typeof ideaText !== 'string' || ideaText.length > 1000) {
      return new Response(JSON.stringify({ error: `Invalid or missing 'ideaText' (max 1000 chars)` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Optimized prompt — lean, structured output handles schema ───
    const prompt = `Validate this startup idea: "${ideaText}"

Research real web data from Reddit, G2, Capterra, Trustpilot, Twitter/X, HN, app stores:
- Demand signals: "I wish...", "why doesn't X exist", Google Trends, Product Hunt launches
- Direct & indirect competitors: names, pricing, weakest reviews, market position
- Pain severity: how painful, how often, what workarounds exist
- Feasibility: tech needed, APIs, realistic MVP scope
- Market size: TAM/SAM/SOM with methodology
- Willingness-to-pay: pricing complaints, budget discussions
- Workarounds, feature gaps, platform risks, GTM channels, defensibility

Score strictly with evidence:
- Demand (0-100): 85+ thousands searching, 70-84 hundreds, 50-69 dozens, <50 few/none
- Pain (0-100): 85+ nightmare/dealbreaker, 70-84 significant, 50-69 tolerable, <50 minor
- Competition (0-100, HIGHER=harder): 85+ funded incumbents, 70-84 established, 50-69 mediocre, <50 few
- MVP Feasibility (0-100): 85+ 1-2 weeks, 70-84 2-4 weeks, 50-69 1-2 months, <50 longer

Verdict: "Build" if demand≥65 AND pain≥55 AND competition<75 AND feasibility≥55. "Pivot" if pain≥45 but approach needs rethinking. "Skip" if demand<40 OR pain<35 OR competition≥80 with no differentiator.`;

    console.log('Starting optimized validation with sonar-pro...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a brutally honest startup advisor. Research real web data, score with evidence, never inflate. Be concise.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'idea_validation',
            schema: {
              type: 'object',
              properties: {
                scores: {
                  type: 'object',
                  properties: {
                    demand: { type: 'number' },
                    pain: { type: 'number' },
                    competition: { type: 'number' },
                    mvpFeasibility: { type: 'number' },
                  },
                  required: ['demand', 'pain', 'competition', 'mvpFeasibility'],
                },
                scoreJustifications: {
                  type: 'object',
                  properties: {
                    demand: { type: 'string' },
                    pain: { type: 'string' },
                    competition: { type: 'string' },
                    mvpFeasibility: { type: 'string' },
                  },
                },
                marketSizing: {
                  type: 'object',
                  properties: {
                    tam: { type: 'string' },
                    sam: { type: 'string' },
                    som: { type: 'string' },
                    methodology: { type: 'string' },
                  },
                },
                verdict: { type: 'string', enum: ['Build', 'Pivot', 'Skip'] },
                verdictReasoning: { type: 'string' },
                pros: { type: 'array', items: { type: 'string' } },
                cons: { type: 'array', items: { type: 'string' } },
                gapOpportunities: { type: 'array', items: { type: 'string' } },
                mvpWedge: { type: 'string' },
                killTest: { type: 'string' },
                competitors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      weakness: { type: 'string' },
                      pricing: { type: 'string' },
                    },
                  },
                },
                wtpSignals: {
                  type: 'object',
                  properties: {
                    strength: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
                    signals: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, source: { type: 'string' }, context: { type: 'string' } } } },
                    priceRange: { type: 'object', properties: { low: { type: 'number' }, mid: { type: 'number' }, high: { type: 'number' }, currency: { type: 'string' } } },
                    summary: { type: 'string' },
                  },
                },
                competitionDensity: {
                  type: 'object',
                  properties: {
                    level: { type: 'string', enum: ['blue_ocean', 'fragmented', 'crowded', 'winner_take_most'] },
                    competitorCount: { type: 'number' },
                    totalFundingEstimate: { type: 'string' },
                    keyIncumbents: { type: 'array', items: { type: 'string' } },
                    switchingCosts: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
                marketTiming: {
                  type: 'object',
                  properties: {
                    phase: { type: 'string', enum: ['emerging', 'growing', 'saturated', 'declining'] },
                    signals: { type: 'array', items: { type: 'string' } },
                    summary: { type: 'string' },
                  },
                },
                icp: {
                  type: 'object',
                  properties: {
                    businessType: { type: 'string' },
                    companySize: { type: 'string' },
                    revenueRange: { type: 'string' },
                    industry: { type: 'string' },
                    techStack: { type: 'array', items: { type: 'string' } },
                    buyingTriggers: { type: 'array', items: { type: 'string' } },
                    budgetRange: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
                workaroundDetection: {
                  type: 'object',
                  properties: {
                    severity: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
                    workarounds: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, source: { type: 'string' }, investmentLevel: { type: 'string', enum: ['low', 'medium', 'high'] } } } },
                    summary: { type: 'string' },
                  },
                },
                featureGapMap: {
                  type: 'object',
                  properties: {
                    gaps: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, competitorCoverage: { type: 'string', enum: ['none', 'weak', 'strong', 'commodity'] }, opportunity: { type: 'string', enum: ['high', 'medium', 'low'] } } } },
                    topWedge: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
                platformRisk: {
                  type: 'object',
                  properties: {
                    level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    signals: { type: 'array', items: { type: 'object', properties: { signal: { type: 'string' }, riskType: { type: 'string', enum: ['bundling', 'api_limitation', 'roadmap_overlap', 'regulation', 'dependency', 'incumbent_improvement', 'platform_consolidation'] } } } },
                    summary: { type: 'string' },
                  },
                },
                gtmStrategy: {
                  type: 'object',
                  properties: {
                    primaryChannel: { type: 'string' },
                    channels: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, viability: { type: 'string', enum: ['high', 'medium', 'low'] }, reasoning: { type: 'string' } } } },
                    founderLedSales: { type: 'boolean' },
                    seoViability: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
                pricingBenchmarks: {
                  type: 'object',
                  properties: {
                    benchmarks: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, price: { type: 'string' }, model: { type: 'string' }, notes: { type: 'string' } } } },
                    suggestedRange: { type: 'object', properties: { low: { type: 'string' }, mid: { type: 'string' }, high: { type: 'string' } } },
                    pricingModel: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
                defensibility: {
                  type: 'object',
                  properties: {
                    overallStrength: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
                    signals: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, strength: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] } } } },
                    timeToMoat: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
              },
              required: ['scores', 'verdict', 'verdictReasoning', 'pros', 'cons'],
            },
          },
        },
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
    console.log(`Response: ${content.length} chars, ${citations.length} citations, ${Date.now() - startTime}ms`);

    let parsed;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        console.error('Failed to parse output:', content.slice(0, 500));
        parsed = {};
      }
    }

    // ─── Verdict consistency check ───
    const scores = parsed.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
    const verdict = parsed.verdict;
    
    let correctedVerdict = verdict;
    // Build requires: demand≥65, pain≥55, competition<75, feasibility≥55
    if (verdict === 'Build' && (scores.demand < 40 || scores.pain < 35)) {
      correctedVerdict = 'Skip';
      parsed.verdictReasoning = `[Auto-corrected from Build to Skip] Insufficient demand/pain evidence. ${parsed.verdictReasoning || ''}`;
    } else if (verdict === 'Build' && (scores.demand < 65 || scores.pain < 55 || scores.competition >= 75 || scores.mvpFeasibility < 55)) {
      correctedVerdict = 'Pivot';
      parsed.verdictReasoning = `[Auto-corrected from Build to Pivot] Scores don't meet Build threshold. ${parsed.verdictReasoning || ''}`;
    }
    // Skip→Build if all thresholds met
    if (verdict === 'Skip' && scores.demand >= 65 && scores.pain >= 55 && scores.competition < 75 && scores.mvpFeasibility >= 55) {
      correctedVerdict = 'Build';
      parsed.verdictReasoning = `[Auto-corrected from Skip to Build] Scores actually meet Build threshold. ${parsed.verdictReasoning || ''}`;
    }
    // Skip→Pivot if strong demand/pain but high competition (opportunity exists, needs differentiation)
    if (verdict === 'Skip' && correctedVerdict === 'Skip' && scores.demand >= 55 && scores.pain >= 45 && scores.competition >= 75) {
      correctedVerdict = 'Pivot';
      parsed.verdictReasoning = `[Auto-corrected from Skip to Pivot] Strong demand & pain signals exist despite high competition — opportunity may work with differentiation. ${parsed.verdictReasoning || ''}`;
    }
    parsed.verdict = correctedVerdict;
    parsed.evidenceLinks = citations;

    console.log(`Complete in ${Date.now() - startTime}ms: Verdict=${parsed.verdict}, Demand=${scores.demand}, Pain=${scores.pain}`);

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
