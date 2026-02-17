import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert product research assistant helping users discover startup and product ideas. You have a natural conversation to understand what they want to build.

Your job:
1. When the user describes an idea or problem area, intelligently infer the target audience, category, and any other context from what they said.
2. Ask only 1-2 SHORT, relevant follow-up questions if needed — never ask obvious or redundant questions.
3. When you have enough context (usually after 1-3 exchanges), respond with a special JSON block to trigger research.

Rules:
- NEVER ask generic questions like "who is this for?" if the answer is obvious from context.
- NEVER show a list of categories or personas to pick from. Infer them.
- Keep responses brief and conversational (1-3 sentences max).
- If the user's first message is detailed enough, skip follow-ups and go straight to generating.
- Be smart about inferring: "sql prompt buddy for users" → persona: developers/data analysts, category: developer tools.

When you have enough context, end your message with this exact JSON block on its own line:
|||READY|||
{"persona": "inferred persona", "category": "inferred category", "region": "", "platform": "inferred or empty", "context": "summary of what user wants"}
|||END|||

Examples of good behavior:
- User: "thinking of custom sql prompt buddy for users" → You know this is for developers/data analysts in developer tools. Ask maybe about platform preference or go straight to ready.
- User: "app for tracking baby milestones" → Parents, Health/Family. Probably mobile. Could go straight to ready.
- User: "something for productivity" → Too vague, ask what specific problem they face.`;

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

    // Check if AI decided it has enough context
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
      // Remove the JSON block from displayed text
      displayText = content.replace(/\|\|\|READY\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
    }

    return new Response(JSON.stringify({ reply: displayText, ready, params }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-generate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
