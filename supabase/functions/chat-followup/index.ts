import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert startup advisor. The user just received a validation report for their idea and wants to discuss it further — pivot strategies, market positioning, refining the idea, or exploring alternatives.

You have the full validation report context. Be concise (2-4 sentences), actionable, and insightful. If the user suggests a pivot or refinement, analyze it briefly and suggest whether it improves the original idea.

If the user wants to re-validate a refined version of their idea, end your message with:
|||REVALIDATE|||
{"ideaText": "the refined idea description"}
|||END|||

Only use REVALIDATE when the user explicitly wants to run a new validation on a changed idea. For general questions, just answer normally.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { messages, reportContext } = await req.json();

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
          { role: 'user', content: `Here is the validation report context:\n${reportContext}` },
          { role: 'assistant', content: 'I have the full context of your validation report. What would you like to explore or refine?' },
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

    return new Response(JSON.stringify({ reply: displayText, revalidate, params }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('chat-followup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
