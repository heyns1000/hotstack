import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Env } from '../types';

const ai = new Hono<{ Bindings: Env }>();

// Super-Agent system context — all 16 marketplace brands + 8 steward roles (v3.4.1)
const SUPER_AGENT_CONTEXT = `You are the Fruitful Super-Agent, the authoritative AI assistant for the Fruitful™ ecosystem running on HotStack™ (hotstack.faa.zone). Answer precisely and concisely. Only answer questions related to the Fruitful ecosystem brands, platform capabilities, and the steward roles described below.

## Fruitful™ Marketplace Brands (16 brands)

Live:
- FAA™ ADVANCED ALGORITHM™ (Legal · Compliance): Registered trademark · Atom-Level Verification™ · Global IP active
- FAA.ZONE™ (Tech · Platform): Ecosystem hub · 120 brands · 6+ continents · Real-time data
- HOTSTACK™ (Build · Deploy): Vibe Builder · 20 templates · Hercules infrastructure · FAA.ZONE data
- SEKELBOS TANK™ (Commerce · Artisan): Artisan marketplace · 20% commission · Franchise-ready · Global
- VAULTMESH™ (Security · Vault): 9-second pulse engine · SHA-256 integrity · Blockchain audit trail
- LICENSEVAULT (Licensing · IP): 13,713 brands verified · FAA™ + HSOMNI9000 + Seedwave
- SEEDWAVECONNECT (Sync · Integration): PulseGlow™ 9s heartbeat · CodeNest sync · BuildNest deploy
- FRUITFUL PLANET CHANGE™ (Impact · Planet): Social enterprise · Ubuntu commerce · Poverty & inequality focus
- CODENEST (Meta · Orchestration): 93 repos · Central orchestrator · Ecosystem sync hub · BuildNest
- BUSH PORTAL™ (Hospitality · Bush): Self-service artisan kiosk · Pancakes · Baobab Terminal
- SEEDWAVE™ (Platform · Signal): Fruitful signal protocol · 9-second VaultMesh pulse · Genesis SEEDWAVE-011

Building:
- CRATE DANCE SHOWCASE™ (Impact · Youth): Global street dance movement · R391M revenue target
- BANIMAL LOOP™ (Impact · Creatures): Ethical creature data synthesis · Baobab Network integration
- AGROCHAIN™ (Agriculture · Biotech): FAA.zone framework · Advanced automation · Food chain data
- FRUITFUL PAY™ (Commerce · Payments): Multi-provider gateway · Paystack · Stripe · PayFast · Crypto.com
- BUILDNEST™ (Build · CI/CD): Turbo monorepo engine · Vercel deploy pipeline

## Platform Architecture
- VaultMesh™ 9-second pulse is the heartbeat of all sync operations
- Cloudflare Workers (Hono) backend + React 19 frontend + D1 database + R2 file storage
- AI inference: Grok-3 (preferred) with Gemini 2.5 Flash fallback

## Super-Agent Steward Roles
1. Source Steward — read repo instructions and immutable source snapshots; classify forks/mirrors/generated files
2. Brand Evidence Reviewer — separate exact source assertions from approved wording and proposed capability
3. Pricing Reconciler — compare like-for-like offers, units, currencies, billing periods, territories and terms
4. Integration Auditor — trace catalogue imports, receipt versions, cache refresh, checkout and webhook settlement
5. Security Reviewer — review authorization, secrets boundaries, data exposure, replay and integrity controls
6. Build Verifier — run available syntax/package checks and record missing runtimes separately
7. Newsroom Editor — append findings and provenance while preserving original styling and history
8. Release Gatekeeper — require exact-target approval for each external write, merge, deployment and commercial release

## Hard Rules
- Never invent prices, UUIDs, or credentials
- Never confirm a deployment or merge without explicit human approval
- Unknown brand or price requests: state clearly that no approved value exists`;

async function callGrok(apiKey: string, question: string, stream = false): Promise<Response> {
  return fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        { role: 'system', content: SUPER_AGENT_CONTEXT },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 600,
      stream,
    }),
  });
}

// POST /api/ai/faq — non-streaming answer
ai.post('/faq', async (c) => {
  try {
    const { question } = await c.req.json() as { question?: string };
    if (!question || typeof question !== 'string') {
      return c.json({ error: 'question is required' }, 400);
    }

    if (c.env.XAI_API_KEY) {
      const res = await callGrok(c.env.XAI_API_KEY, question);
      if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      return c.json({ answer: data.choices[0]?.message?.content ?? '', provider: 'grok' });
    }

    if (!c.env.GEMINI_API_KEY) {
      return c.json({ error: 'No AI provider configured (XAI_API_KEY or GEMINI_API_KEY required)' }, 500);
    }
    const genai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SUPER_AGENT_CONTEXT}\n\nQuestion: "${question}"\n\nAnswer:`,
      config: { temperature: 0.7, maxOutputTokens: 600 },
    });
    return c.json({ answer: response.text, provider: 'gemini' });
  } catch (error) {
    console.error('AI FAQ error:', error);
    return c.json({ error: 'Failed to generate answer', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

// POST /api/ai/faq-stream — SSE streaming answer
ai.post('/faq-stream', async (c) => {
  try {
    const { question } = await c.req.json() as { question?: string };
    if (!question || typeof question !== 'string') {
      return c.json({ error: 'question is required' }, 400);
    }

    const sseHeaders = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' };

    if (c.env.XAI_API_KEY) {
      const grokRes = await callGrok(c.env.XAI_API_KEY, question, true);
      if (!grokRes.ok || !grokRes.body) {
        return c.json({ error: `Grok streaming error: ${await grokRes.text()}` }, 500);
      }
      const decoder = new TextDecoder();
      return new Response(new ReadableStream({
        async start(controller) {
          const reader = grokRes.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              for (const line of decoder.decode(value).split('\n')) {
                if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
                try {
                  const chunk = JSON.parse(line.slice(6)) as { choices: Array<{ delta: { content?: string } }> };
                  const text = chunk.choices[0]?.delta?.content;
                  if (text) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
                } catch { /* skip malformed lines */ }
              }
            }
            controller.close();
          } catch (e) { controller.error(e); }
        },
      }), { headers: sseHeaders });
    }

    if (!c.env.GEMINI_API_KEY) {
      return c.json({ error: 'No AI provider configured (XAI_API_KEY or GEMINI_API_KEY required)' }, 500);
    }
    const genai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const stream = await genai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: `${SUPER_AGENT_CONTEXT}\n\nQuestion: "${question}"\n\nAnswer:`,
      config: { temperature: 0.7, maxOutputTokens: 600 },
    });
    return new Response(new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
          }
          controller.close();
        } catch (e) { controller.error(e); }
      },
    }), { headers: sseHeaders });
  } catch (error) {
    console.error('AI stream error:', error);
    return c.json({ error: 'Failed to stream answer', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

// POST /api/ai/agent — multi-step super-agent with role routing
ai.post('/agent', async (c) => {
  try {
    const { task, role } = await c.req.json() as { task?: string; role?: string };
    if (!task || typeof task !== 'string') {
      return c.json({ error: 'task is required' }, 400);
    }

    const roleInstruction = role
      ? `\n\nYou are acting as the "${role}" steward role. Apply that role's specific boundaries and output format.`
      : '';

    const prompt = `${SUPER_AGENT_CONTEXT}${roleInstruction}\n\nTask: ${task}\n\nResponse:`;

    if (c.env.XAI_API_KEY) {
      const res = await callGrok(c.env.XAI_API_KEY, `${roleInstruction ? `[Role: ${role}] ` : ''}${task}`);
      if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      return c.json({ result: data.choices[0]?.message?.content ?? '', role: role ?? 'general', provider: 'grok' });
    }

    if (!c.env.GEMINI_API_KEY) {
      return c.json({ error: 'No AI provider configured' }, 500);
    }
    const genai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.5, maxOutputTokens: 1000 },
    });
    return c.json({ result: response.text, role: role ?? 'general', provider: 'gemini' });
  } catch (error) {
    console.error('Agent error:', error);
    return c.json({ error: 'Agent task failed', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

export default ai;
