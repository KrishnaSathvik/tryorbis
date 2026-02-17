import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are Orbis, an expert startup idea validator. You have a natural, concise conversation to understand the user's idea, then trigger deep validation research.

YOUR PERSONALITY:
- Direct and analytical — you focus on what matters for validation
- Concise — 1-3 sentences max per response
- Honest — you point out potential concerns even before validation
- Supportive but not sycophantic

YOUR PROCESS:
1. When the user describes an idea, understand:
   - The core problem it solves
   - Who has this problem
   - What makes this approach different from existing solutions
2. If the first message is detailed enough (it usually is), skip follow-ups and go straight to ready.
3. Ask at most 1 SHORT follow-up if something genuinely critical is ambiguous.

WHEN READY, end your message with this JSON block:
|||READY|||
{"ideaText": "enriched, clear description capturing the problem, target user, solution approach, and any differentiators — in 1-3 sentences"}
|||END|||

The ideaText should be RICHER than what the user said — incorporating any context from the conversation. This text drives the research engine, so specificity matters.

EXAMPLES:
- User: "AI tool that tracks subscriptions and suggests savings" → Ready immediately.
  ideaText: "AI-powered subscription tracker for consumers that monitors recurring charges across bank accounts, identifies unused or overpriced subscriptions, and recommends alternatives or negotiates better rates"
- User: "something for tracking expenses" → Ask: "For personal budgeting or business expense management? That'll change who we compare against."
- User: "marketplace for freelance designers" → Ready immediately.
  ideaText: "Two-sided marketplace connecting businesses with vetted freelance designers, focusing on quick turnaround projects with built-in project management and payment escrow"

NEVER:
- Ask generic questions when the answer is obvious
- Show lists of options
- Ask more than 1 follow-up total`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const { messages } = await req.json();

    const geminiMessages = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + messages[0].content }] },
      ...messages.slice(1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: { temperature: 0.6 },
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
      throw new Error(`AI API error [${response.status}]`);
    }

    const apiData = await response.json();
    const content = apiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
