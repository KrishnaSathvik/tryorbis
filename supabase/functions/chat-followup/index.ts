import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are Orbis, a senior startup advisor. The user just received a validation or generation report for their idea and wants to dig deeper.

You have the full report context. Your responses should be:
- **Concise**: 2-4 sentences, actionable and specific
- **Strategic**: Focus on what matters — positioning, differentiation, go-to-market, pivots
- **Evidence-aware**: Reference the data from the report when possible
- **Contrarian when needed**: Push back if the user's idea has obvious flaws

WHAT YOU CAN HELP WITH:
- Pivot strategies: "What if I focus on [segment] instead?"
- Positioning: "How do I differentiate from [competitor]?"
- Go-to-market: "What's the fastest way to get first users?"
- Pricing strategy: "How should I price this?"
- Feature scoping: "What should the MVP include/exclude?"
- Risk assessment: "What could go wrong?"

If the user suggests a pivot or refinement and wants to re-validate it, end your message with:
|||REVALIDATE|||
{"ideaText": "the refined idea description"}
|||END|||

Only use REVALIDATE when the user explicitly wants to run a new validation on a changed/pivoted idea. For general strategy questions, just answer normally.

NEVER:
- Give vague motivational advice like "follow your passion"
- Ignore the data from the report
- Be overly diplomatic when the idea has clear problems`;

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

    // ─── Rate limiting (10 req/min) ───
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: allowed } = await serviceClient.rpc('check_rate_limit', {
      p_user_id: userId, p_function_name: 'chat-followup',
    });
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Follow-up chat is free — no credit deduction

    const startTime = Date.now();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { messages, reportContext } = await req.json();

    const systemContent = [
      SYSTEM_PROMPT,
      `\nHere is the full validation/generation report context:\n\n${reportContext}`,
    ].join('\n');

    const apiMessages = [
      { role: 'system', content: systemContent },
      { role: 'assistant', content: "I've reviewed your full report. What would you like to explore — pivots, positioning, go-to-market, or something else?" },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: apiMessages,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('AI API error:', response.status, errBody);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`API error [${response.status}]`);
    }

    const apiData = await response.json();
    const content = apiData.choices?.[0]?.message?.content || '';

    const revalMatch = content.match(/\|\|\|REVALIDATE\|\|\|\s*(\{[\s\S]*?\})\s*\|\|\|END\|\|\|/);
    let revalidate = false;
    let params = null;
    let displayText = content;

    if (revalMatch) {
      revalidate = true;
      try {
        params = JSON.parse(revalMatch[1]);
      } catch {
        revalidate = false;
      }
      displayText = content.replace(/\|\|\|REVALIDATE\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
    }

    // ─── Log success ───
    await serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'chat-followup', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'gemini-3-flash-preview',
    });

    return new Response(JSON.stringify({ reply: displayText, revalidate, params }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-followup error:', error);
    try {
      const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await svc.from('request_logs').insert({
        user_id: 'unknown', function_name: 'chat-followup', status: 'error',
        latency_ms: 0, error_type: 'api_error', error_message: (error.message || '').slice(0, 500),
      });
    } catch {}
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
