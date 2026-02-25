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

    const body = await req.json();
    const { persona, category, region, platform, context, mode } = body;
    const isDeep = mode === 'deep';
    const creditCost = isDeep ? 3 : 1;

    // ─── Server-side credit check & deduction ───
    const { data: deducted } = await serviceClient.rpc('try_deduct_credits', { p_user_id: userId, p_amount: creditCost });
    if (!deducted) {
      return new Response(JSON.stringify({ error: isDeep ? 'Insufficient credits (Deep Research requires 3 credits)' : 'Insufficient credits' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('API key not configured');

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

    // ─── Optimized prompt — no JSON template, structured output handles schema ───
    const prompt = `Research real complaints from "${persona}" in "${category}"${region ? ` in ${region}` : ''}${platform ? ` on ${platform}` : ''}.${context ? ` Context: "${context}"` : ''}

Search Reddit, G2, Capterra, Trustpilot, Twitter/X, HN, Indie Hackers, app stores for:
- Frustration posts, 1-3 star reviews, "I hate X" / "why is X so hard" complaints
- Willingness-to-pay signals, pricing complaints, budget discussions
- Workarounds: spreadsheets, scripts, Zapier, "built our own"
- Feature gaps: "I wish [tool] had..."
- Competitor names, pricing, weaknesses, funding
- Google Trends, VC activity, regulations for market timing
- GTM channels competitors use, SEO viability
- Platform risks: bundling, API deprecations
- Defensibility: network effects, switching costs, data moats

Group complaints into 4-6 thematic clusters ranked by severity × frequency. Generate 4-6 product ideas with unique brandable names (like "Loom", "Notion"). Score demand strictly: 85-95 massive, 70-84 strong, 55-69 moderate, 40-54 weak, <40 minimal.${isDeep ? `\n\nIMPORTANT: Respond with valid JSON only (no markdown, no code fences). Use keys: problemClusters, ideaSuggestions, wtpSignals, competitionDensity, marketTiming, icp, workaroundDetection, featureGapMap, platformRisk, gtmStrategy, pricingBenchmarks, defensibility.` : ''}`;

    const modelName = isDeep ? 'sonar-deep-research' : 'sonar-pro';
    console.log(`Starting research with ${modelName} (mode=${mode || 'regular'}, cost=${creditCost})...`);

    const jsonSchema = {
      name: 'market_research',
      schema: {
        type: 'object',
        properties: {
          problemClusters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                theme: { type: 'string' },
                painSummary: { type: 'string' },
                complaintCount: { type: 'number' },
                evidenceLinks: { type: 'array', items: { type: 'string' } },
                complaints: { type: 'array', items: { type: 'string' } },
              },
              required: ['id', 'theme', 'painSummary', 'complaintCount', 'complaints'],
            },
          },
          ideaSuggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                clusterId: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                mvpScope: { type: 'string' },
                monetization: { type: 'string' },
                demandScore: { type: 'number' },
              },
              required: ['id', 'name', 'description', 'mvpScope', 'demandScore'],
            },
          },
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
        required: ['problemClusters', 'ideaSuggestions'],
      },
    };

    const requestBody: any = {
      model: modelName,
      messages: [
        { role: 'system', content: `You are a market research analyst. Research real web data, cite sources, never fabricate. Be thorough but concise.${isDeep ? ' You MUST respond with valid JSON only — no markdown, no code fences, no extra text.' : ''}` },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    };

    // sonar-deep-research does NOT support response_format json_schema
    if (!isDeep) {
      requestBody.response_format = { type: 'json_schema', json_schema: jsonSchema };
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    console.log(`Response: ${content.length} chars, ${citations.length} citations, ${Date.now() - startTime}ms`);

    let parsed;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      // Fallback: try extracting JSON from content
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { problemClusters: [], ideaSuggestions: [] };
      } catch {
        console.error('Failed to parse output, raw:', content.slice(0, 500));
        parsed = { problemClusters: [], ideaSuggestions: [] };
      }
    }

    // Distribute citations to clusters
    if (citations.length > 0 && parsed.problemClusters?.length > 0) {
      const perCluster = Math.max(1, Math.floor(citations.length / parsed.problemClusters.length));
      parsed.problemClusters.forEach((cluster: any, i: number) => {
        if (!cluster.evidenceLinks || cluster.evidenceLinks.length === 0) {
          cluster.evidenceLinks = citations.slice(i * perCluster, (i + 1) * perCluster);
        }
      });
    }
    parsed.evidenceLinks = citations;

    console.log(`Complete in ${Date.now() - startTime}ms: ${parsed.problemClusters?.length || 0} clusters, ${parsed.ideaSuggestions?.length || 0} ideas`);

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
