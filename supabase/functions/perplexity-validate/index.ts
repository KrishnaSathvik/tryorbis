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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

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

    const body = await req.json();
    const { ideaText, mode, stage, previousContext } = body;
    const isDeep = mode === 'deep';
    const creditCost = 1;

    // ─── Credit deduction — only on first stage or regular mode ───
    if (!stage || stage === 'core') {
      const { data: deducted } = await serviceClient.rpc('try_deduct_credits', { p_user_id: userId, p_amount: creditCost });
      if (!deducted) {
        return new Response(JSON.stringify({ error: 'You have used all your free reports' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('API key not configured');

    if (!ideaText || typeof ideaText !== 'string' || ideaText.length > 1000) {
      return new Response(JSON.stringify({ error: `Invalid or missing 'ideaText' (max 1000 chars)` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Build prompt, schema, model based on mode/stage ───
    let prompt: string;
    let jsonSchema: any;
    let modelName: string;
    let systemMessage: string;
    let timeoutMs = 60000;

    if (isDeep && stage) {
      // ── Multi-stage deep validation — sonar-pro for each stage (~15s) ──
      modelName = 'sonar-pro';

      if (stage === 'core') {
        systemMessage = 'You are a brutally honest startup advisor. Research real web data, score with evidence, never inflate. Be concise.';
        prompt = `Validate this startup idea: "${ideaText}"

Research real web data from Reddit, G2, Capterra, Trustpilot, Twitter/X, HN, app stores:
- Demand signals: "I wish...", "why doesn't X exist", Google Trends, Product Hunt launches
- Pain severity: how painful, how often, what workarounds exist
- Feasibility: tech needed, APIs, realistic MVP scope
- Market size: TAM/SAM/SOM with methodology
- Feature gaps and gap opportunities

Score strictly with evidence:
- Demand (0-100): 85+ thousands searching, 70-84 hundreds, 50-69 dozens, <50 few/none
- Pain (0-100): 85+ nightmare/dealbreaker, 70-84 significant, 50-69 tolerable, <50 minor
- Competition (0-100, HIGHER=harder): 85+ funded incumbents, 70-84 established, 50-69 mediocre, <50 few
- MVP Feasibility (0-100): 85+ 1-2 weeks, 70-84 2-4 weeks, 50-69 1-2 months, <50 longer

Verdict: "Build" if demand>=65 AND pain>=55 AND competition<75 AND feasibility>=55. "Pivot" if pain>=45 but approach needs rethinking. "Skip" if demand<40 OR pain<35 OR competition>=80 with no differentiator.`;

        jsonSchema = {
          name: 'core_validation',
          schema: {
            type: 'object',
            properties: {
              scores: { type: 'object', properties: { demand: { type: 'number' }, pain: { type: 'number' }, competition: { type: 'number' }, mvpFeasibility: { type: 'number' } }, required: ['demand', 'pain', 'competition', 'mvpFeasibility'] },
              scoreJustifications: { type: 'object', properties: { demand: { type: 'string' }, pain: { type: 'string' }, competition: { type: 'string' }, mvpFeasibility: { type: 'string' } } },
              verdict: { type: 'string', enum: ['Build', 'Pivot', 'Skip'] },
              verdictReasoning: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              gapOpportunities: { type: 'array', items: { type: 'string' } },
              mvpWedge: { type: 'string' },
              killTest: { type: 'string' },
            },
            required: ['scores', 'verdict', 'verdictReasoning', 'pros', 'cons', 'gapOpportunities', 'mvpWedge', 'killTest'],
          },
        };
      } else if (stage === 'competitors') {
        systemMessage = 'You are a competitive intelligence analyst. Research real competitors with actual pricing, weaknesses, and market positioning.';
        prompt = `For this startup idea: "${ideaText}"

${previousContext}

Research and provide:
1. Direct and indirect competitors: real company names, actual pricing, their weakest reviews, market position
2. Market sizing with methodology: TAM (Total Addressable Market), SAM (Serviceable Addressable Market), SOM (Serviceable Obtainable Market)

Be specific — use real company names and real pricing data from their websites.`;

        jsonSchema = {
          name: 'competitors_stage',
          schema: {
            type: 'object',
            properties: {
              competitors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, weakness: { type: 'string' }, pricing: { type: 'string' } } } },
              marketSizing: { type: 'object', properties: { tam: { type: 'string' }, sam: { type: 'string' }, som: { type: 'string' }, methodology: { type: 'string' } } },
            },
            required: ['competitors', 'marketSizing'],
          },
        };
      } else if (stage === 'intelligence') {
        systemMessage = 'You are a market intelligence analyst. Provide deep, evidence-based analysis with real data across all dimensions requested.';
        prompt = `For this startup idea: "${ideaText}"

${previousContext}

Provide comprehensive market intelligence across these 10 dimensions:
1. Willingness-to-pay: real quotes about pricing, budget discussions, price complaints, estimated price ranges
2. Competition density: competitor count, total funding, key incumbents, switching costs
3. Market timing: growth phase, trend signals, regulatory changes
4. Ideal Customer Profile: business type, company size, revenue range, industry, tech stack, buying triggers
5. Workaround detection: what people use today (spreadsheets, scripts, manual processes), investment level
6. Feature gap map: missing features across competitors, top wedge opportunity for a new entrant
7. Platform risk: API dependency risks, bundling threats, regulatory risks
8. GTM strategy: best channels to reach customers, founder-led sales viability, SEO opportunity
9. Pricing benchmarks: competitor pricing details, suggested price range, recommended pricing model
10. Defensibility: moat potential (network effects, data advantages, switching costs), time to build moat`;

        jsonSchema = {
          name: 'intelligence_stage',
          schema: {
            type: 'object',
            properties: {
              wtpSignals: { type: 'object', properties: { strength: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, source: { type: 'string' }, context: { type: 'string' } } } }, priceRange: { type: 'object', properties: { low: { type: 'number' }, mid: { type: 'number' }, high: { type: 'number' }, currency: { type: 'string' } } }, summary: { type: 'string' } } },
              competitionDensity: { type: 'object', properties: { level: { type: 'string' }, competitorCount: { type: 'number' }, totalFundingEstimate: { type: 'string' }, keyIncumbents: { type: 'array', items: { type: 'string' } }, switchingCosts: { type: 'string' }, summary: { type: 'string' } } },
              marketTiming: { type: 'object', properties: { phase: { type: 'string' }, signals: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' } } },
              icp: { type: 'object', properties: { businessType: { type: 'string' }, companySize: { type: 'string' }, revenueRange: { type: 'string' }, industry: { type: 'string' }, techStack: { type: 'array', items: { type: 'string' } }, buyingTriggers: { type: 'array', items: { type: 'string' } }, budgetRange: { type: 'string' }, summary: { type: 'string' } } },
              workaroundDetection: { type: 'object', properties: { severity: { type: 'string' }, workarounds: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, source: { type: 'string' }, investmentLevel: { type: 'string' } } } }, summary: { type: 'string' } } },
              featureGapMap: { type: 'object', properties: { gaps: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, competitorCoverage: { type: 'string' }, opportunity: { type: 'string' } } } }, topWedge: { type: 'string' }, summary: { type: 'string' } } },
              platformRisk: { type: 'object', properties: { level: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { signal: { type: 'string' }, riskType: { type: 'string' } } } }, summary: { type: 'string' } } },
              gtmStrategy: { type: 'object', properties: { primaryChannel: { type: 'string' }, channels: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, viability: { type: 'string' }, reasoning: { type: 'string' } } } }, founderLedSales: { type: 'boolean' }, seoViability: { type: 'string' }, summary: { type: 'string' } } },
              pricingBenchmarks: { type: 'object', properties: { benchmarks: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, price: { type: 'string' }, model: { type: 'string' }, notes: { type: 'string' } } } }, suggestedRange: { type: 'object', properties: { low: { type: 'string' }, mid: { type: 'string' }, high: { type: 'string' } } }, pricingModel: { type: 'string' }, summary: { type: 'string' } } },
              defensibility: { type: 'object', properties: { overallStrength: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, strength: { type: 'string' } } } }, timeToMoat: { type: 'string' }, summary: { type: 'string' } } },
            },
            required: [],
          },
        };
      } else {
        return new Response(JSON.stringify({ error: 'Invalid stage parameter' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // ── Regular mode or legacy deep mode (single call) ──
      modelName = isDeep ? 'sonar-deep-research' : 'sonar-pro';
      timeoutMs = isDeep ? 120000 : 60000;
      systemMessage = `You are a brutally honest startup advisor. Research real web data, score with evidence, never inflate. Be concise.${isDeep ? ' You MUST respond with valid JSON only — no markdown, no code fences, no extra text.' : ''}`;

      prompt = `Validate this startup idea: "${ideaText}"

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

Verdict: "Build" if demand>=65 AND pain>=55 AND competition<75 AND feasibility>=55. "Pivot" if pain>=45 but approach needs rethinking. "Skip" if demand<40 OR pain<35 OR competition>=80 with no differentiator.${isDeep ? `\n\nIMPORTANT: Respond with valid JSON only (no markdown, no code fences). Use keys: scores, verdict, verdictReasoning, pros, cons, gapOpportunities, mvpWedge, killTest, competitors, marketSizing, wtpSignals, competitionDensity, marketTiming, icp, workaroundDetection, featureGapMap, platformRisk, gtmStrategy, pricingBenchmarks, defensibility.` : ''}`;

      jsonSchema = {
        name: 'idea_validation',
        schema: {
          type: 'object',
          properties: {
            scores: { type: 'object', properties: { demand: { type: 'number' }, pain: { type: 'number' }, competition: { type: 'number' }, mvpFeasibility: { type: 'number' } }, required: ['demand', 'pain', 'competition', 'mvpFeasibility'] },
            scoreJustifications: { type: 'object', properties: { demand: { type: 'string' }, pain: { type: 'string' }, competition: { type: 'string' }, mvpFeasibility: { type: 'string' } } },
            marketSizing: { type: 'object', properties: { tam: { type: 'string' }, sam: { type: 'string' }, som: { type: 'string' }, methodology: { type: 'string' } } },
            verdict: { type: 'string', enum: ['Build', 'Pivot', 'Skip'] },
            verdictReasoning: { type: 'string' },
            pros: { type: 'array', items: { type: 'string' } },
            cons: { type: 'array', items: { type: 'string' } },
            gapOpportunities: { type: 'array', items: { type: 'string' } },
            mvpWedge: { type: 'string' },
            killTest: { type: 'string' },
            competitors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, weakness: { type: 'string' }, pricing: { type: 'string' } } } },
            wtpSignals: { type: 'object', properties: { strength: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, source: { type: 'string' }, context: { type: 'string' } } } }, priceRange: { type: 'object', properties: { low: { type: 'number' }, mid: { type: 'number' }, high: { type: 'number' }, currency: { type: 'string' } } }, summary: { type: 'string' } } },
            competitionDensity: { type: 'object', properties: { level: { type: 'string' }, competitorCount: { type: 'number' }, totalFundingEstimate: { type: 'string' }, keyIncumbents: { type: 'array', items: { type: 'string' } }, switchingCosts: { type: 'string' }, summary: { type: 'string' } } },
            marketTiming: { type: 'object', properties: { phase: { type: 'string' }, signals: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' } } },
            icp: { type: 'object', properties: { businessType: { type: 'string' }, companySize: { type: 'string' }, revenueRange: { type: 'string' }, industry: { type: 'string' }, techStack: { type: 'array', items: { type: 'string' } }, buyingTriggers: { type: 'array', items: { type: 'string' } }, budgetRange: { type: 'string' }, summary: { type: 'string' } } },
            workaroundDetection: { type: 'object', properties: { severity: { type: 'string' }, workarounds: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, source: { type: 'string' }, investmentLevel: { type: 'string' } } } }, summary: { type: 'string' } } },
            featureGapMap: { type: 'object', properties: { gaps: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, competitorCoverage: { type: 'string' }, opportunity: { type: 'string' } } } }, topWedge: { type: 'string' }, summary: { type: 'string' } } },
            platformRisk: { type: 'object', properties: { level: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { signal: { type: 'string' }, riskType: { type: 'string' } } } }, summary: { type: 'string' } } },
            gtmStrategy: { type: 'object', properties: { primaryChannel: { type: 'string' }, channels: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, viability: { type: 'string' }, reasoning: { type: 'string' } } } }, founderLedSales: { type: 'boolean' }, seoViability: { type: 'string' }, summary: { type: 'string' } } },
            pricingBenchmarks: { type: 'object', properties: { benchmarks: { type: 'array', items: { type: 'object', properties: { tool: { type: 'string' }, price: { type: 'string' }, model: { type: 'string' }, notes: { type: 'string' } } } }, suggestedRange: { type: 'object', properties: { low: { type: 'string' }, mid: { type: 'string' }, high: { type: 'string' } } }, pricingModel: { type: 'string' }, summary: { type: 'string' } } },
            defensibility: { type: 'object', properties: { overallStrength: { type: 'string' }, signals: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, strength: { type: 'string' } } } }, timeToMoat: { type: 'string' }, summary: { type: 'string' } } },
          },
          required: ['scores', 'verdict', 'verdictReasoning', 'pros', 'cons', 'gapOpportunities', 'mvpWedge', 'killTest', 'competitors'],
        },
      };
    }

    console.log(`Starting validation with ${modelName} (mode=${mode || 'regular'}, stage=${stage || 'full'}, timeout=${timeoutMs}ms)...`);

    const requestBody: any = {
      model: modelName,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    };

    // sonar-deep-research does NOT support response_format json_schema
    if (modelName !== 'sonar-deep-research') {
      requestBody.response_format = { type: 'json_schema', json_schema: jsonSchema };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        if (!stage || stage === 'core') {
          try { await serviceClient.rpc('refund_credit', { p_user_id: userId, p_amount: creditCost }); } catch {};
        }
        console.error(`Validation timed out after ${timeoutMs}ms — credit refunded`);
        return new Response(JSON.stringify({ error: 'Research timed out. Your credit has been refunded. Try Regular mode for faster results.' }), {
          status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw fetchErr;
    }
    clearTimeout(timeout);

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

    // ─── Verdict consistency check (only for core stage or full mode) ───
    if (!stage || stage === 'core') {
      const scores = parsed.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
      const verdict = parsed.verdict;

      let correctedVerdict = verdict;
      if (verdict === 'Build' && (scores.demand < 40 || scores.pain < 35)) {
        correctedVerdict = 'Skip';
        parsed.verdictReasoning = `[Auto-corrected from Build to Skip] Insufficient demand/pain evidence. ${parsed.verdictReasoning || ''}`;
      } else if (verdict === 'Build' && (scores.demand < 65 || scores.pain < 55 || scores.competition >= 75 || scores.mvpFeasibility < 55)) {
        correctedVerdict = 'Pivot';
        parsed.verdictReasoning = `[Auto-corrected from Build to Pivot] Scores don't meet Build threshold. ${parsed.verdictReasoning || ''}`;
      }
      if (verdict === 'Skip' && scores.demand >= 65 && scores.pain >= 55 && scores.competition < 75 && scores.mvpFeasibility >= 55) {
        correctedVerdict = 'Build';
        parsed.verdictReasoning = `[Auto-corrected from Skip to Build] Scores actually meet Build threshold. ${parsed.verdictReasoning || ''}`;
      }
      if (verdict === 'Skip' && correctedVerdict === 'Skip' && scores.demand >= 55 && scores.pain >= 45 && scores.competition >= 75) {
        correctedVerdict = 'Pivot';
        parsed.verdictReasoning = `[Auto-corrected from Skip to Pivot] Strong demand & pain signals exist despite high competition — opportunity may work with differentiation. ${parsed.verdictReasoning || ''}`;
      }
      parsed.verdict = correctedVerdict;
    }

    parsed.evidenceLinks = citations;

    console.log(`Complete in ${Date.now() - startTime}ms (stage=${stage || 'full'}): Verdict=${parsed.verdict || 'N/A'}`);

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
