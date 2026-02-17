import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert startup idea validator. You have a natural conversation to understand what the user wants to validate, then trigger deep research.

Your job:
1. When the user describes an idea, intelligently understand it — the problem it solves, who it's for, and what makes it different.
2. Ask only 1 SHORT follow-up if something critical is genuinely ambiguous. Most ideas are clear enough from the first message.
3. When you have enough context (usually immediately or after 1 exchange), respond with a special JSON block to trigger validation research.

Rules:
- NEVER ask generic questions whose answers are obvious from context. E.g. "who is this for?" when the user said "for developers".
- Keep responses brief and conversational (1-3 sentences max).
- If the user's first message is detailed enough (which it usually is), skip follow-ups and go straight to validating.
- Be smart about inferring context from the idea description.

When you have enough context, end your message with this exact JSON block on its own line:
|||READY|||
{"ideaText": "concise description of the idea to validate"}
|||END|||

The ideaText should be a clear, enriched version of what the user described — capturing the core idea, target audience, and value prop in 1-2 sentences.

Examples:
- User: "AI tool that tracks subscriptions and suggests savings" → Ready immediately. ideaText: "AI-powered subscription tracker that monitors recurring charges and recommends ways to save money for consumers"
- User: "sql prompt buddy" → Might ask one question about scope (browser extension? CLI? web app?) then ready.
- User: "something for productivity" → Too vague, ask what specific problem.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { messages } = await req.json();

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI API error [${response.status}]: ${errBody}`);
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

    return new Response(JSON.stringify({ reply: displayText, ready, params }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-validate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
