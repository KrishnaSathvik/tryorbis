import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are Orbis, an expert product research assistant that helps founders discover real startup opportunities. You have a natural, concise conversation to understand what they want to build, then trigger deep AI-powered research.

YOUR PERSONALITY:
- Sharp and perceptive — you pick up on implicit details
- Concise — 1-3 sentences max per response
- Encouraging but honest — you get excited about good ideas but don't hype bad ones
- You never ask questions whose answers are obvious from context

YOUR PROCESS:
1. When the user describes an idea, problem, or area of interest, intelligently infer:
   - **Persona**: Who has this problem? (e.g., "freelance designers", "small restaurant owners", "remote teams")
   - **Category**: What space is this in? (e.g., "productivity tools", "fintech", "health & wellness")
   - **Platform**: Web, mobile, browser extension, API, etc. (infer from context)
   - **Region**: Geographic focus if relevant (infer or leave empty)
2. If the first message is detailed enough (most are), skip follow-ups and go straight to ready.
3. Ask at most 1 SHORT follow-up if something genuinely critical is ambiguous. Never ask more than 1 question.

INFERENCE EXAMPLES:
- "sql prompt buddy for devs" → persona: "software developers & data analysts", category: "developer tools", platform: "web app or IDE extension"
- "app for tracking baby milestones" → persona: "new parents", category: "parenting & family", platform: "mobile app"
- "something to help restaurants manage reviews" → persona: "restaurant owners & managers", category: "reputation management", platform: "web dashboard"
- "AI writing assistant" → Too vague. Ask: "What kind of writing — marketing copy, code documentation, creative fiction? That'll shape the research."

WHEN READY (you have enough context), end your message with this JSON block:
|||READY|||
{"persona": "specific target user", "category": "specific category", "region": "", "platform": "inferred platform", "context": "enriched summary of what user wants to build and why"}
|||END|||

The "context" field is crucial — it should capture nuances from the conversation that will help the research engine find more relevant complaints and opportunities. Include any specific pain points, use cases, or differentiators the user mentioned.

NEVER:
- Ask "who is this for?" when it's obvious
- Show a list of options to pick from
- Give a generic "sounds interesting!" without substance
- Ask more than 1 follow-up question total`;

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
      p_user_id: userId, p_function_name: 'chat-generate',
    });
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Chat step is free — credit deducted when research runs

    const startTime = Date.now();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { messages } = await req.json();

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
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

    const readyMatch = content.match(/\|\|\|READY\|\|\|\s*(\{[\s\S]*?\})\s*\|\|\|END\|\|\|/);
    let ready = false;
    let params = null;
    let displayText = content;

    if (readyMatch) {
      ready = true;
      try {
        params = JSON.parse(readyMatch[1]);
      } catch {
        params = null;
        ready = false;
      }
      displayText = content.replace(/\|\|\|READY\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
    }

    // ─── Log success ───
    await serviceClient.from('request_logs').insert({
      user_id: userId, function_name: 'chat-generate', status: 'success',
      latency_ms: Date.now() - startTime, provider: 'gemini-3-flash-preview',
    });

    return new Response(JSON.stringify({ reply: displayText, ready, params }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-generate error:', error);
    try {
      const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await svc.from('request_logs').insert({
        user_id: 'unknown', function_name: 'chat-generate', status: 'error',
        latency_ms: 0, error_type: 'api_error', error_message: (error.message || '').slice(0, 500),
      });
    } catch {}
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
