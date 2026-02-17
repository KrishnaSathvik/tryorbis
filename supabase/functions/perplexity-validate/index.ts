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

    // GEMINI_API_KEY is fetched later in Pass 2

    const { ideaText } = await req.json();

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

Return your findings as detailed unstructured text with all data points, quotes, competitor names, pricing, URLs. Do NOT format as JSON — give me the raw research.`;

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
          { role: 'system', content: 'You are a meticulous market research analyst specializing in startup validation. Find real, verifiable data — not assumptions. Cite sources. Be thorough and specific with numbers, pricing, and competitor details.' },
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
      throw new Error(`Perplexity API error [${researchResponse.status}]`);
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

Return ONLY valid JSON:
{
  "scores": {
    "demand": 72,
    "pain": 65,
    "competition": 55,
    "mvpFeasibility": 80
  },
  "scoreJustifications": {
    "demand": "Why this score — cite specific evidence",
    "pain": "Why this score — cite specific evidence",
    "competition": "Why this score — list key competitors and their strengths",
    "mvpFeasibility": "Why this score — what tech is needed"
  },
  "marketSizing": {
    "tam": "Total Addressable Market — the entire revenue opportunity if 100% market share (e.g. '$4.2B — global restaurant management software market')",
    "sam": "Serviceable Addressable Market — the segment you can realistically target (e.g. '$620M — US independent restaurants needing review management')",
    "som": "Serviceable Obtainable Market — realistic first 2-3 year capture (e.g. '$12M — 5,000 independent restaurants at $200/mo')",
    "methodology": "Brief explanation of how you arrived at these estimates, citing research data"
  },
  "verdict": "Build",
  "verdictReasoning": "2-3 sentences explaining why this verdict follows from the scores and evidence",
  "pros": ["Specific evidence-backed pro 1", "Pro 2", "Pro 3"],
  "cons": ["Specific evidence-backed con 1", "Con 2"],
  "gapOpportunities": ["Specific gap competitors miss 1", "Gap 2"],
  "mvpWedge": "The specific smallest version to build first, targeting the highest-pain cluster with the least competition",
  "killTest": "The single most important thing to test before building — what evidence would definitively prove this idea won't work",
  "competitors": [
    {"name": "Real Competitor", "weakness": "Their specific weakness based on user reviews", "pricing": "$X/mo or free tier + $Y/mo"}
  ]
}`;

    console.log('Pass 2: Analysis with Gemini Flash...');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: 'You are a brutally honest startup advisor. Your job is to save founders from wasting time on bad ideas AND to greenlight genuinely promising ones. Never be diplomatic at the expense of truth. Base every score and statement on the research evidence provided.\n\n' + analysisPrompt }] },
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
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error [${analysisResponse.status}]`);
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      console.error('Failed to parse Gemini output:', analysisContent.slice(0, 500));
      parsed = {};
    }

    // ─── PASS 3: Verdict consistency check ───
    const scores = parsed.scores || { demand: 0, pain: 0, competition: 0, mvpFeasibility: 0 };
    const verdict = parsed.verdict;
    
    // Auto-correct obviously inconsistent verdicts
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

    console.log(`Complete: Verdict=${parsed.verdict}, Demand=${scores.demand}, Pain=${scores.pain}, Competition=${scores.competition}, Feasibility=${scores.mvpFeasibility}`);

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
