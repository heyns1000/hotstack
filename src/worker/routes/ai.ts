import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Env } from '../types';

const ai = new Hono<{ Bindings: Env }>();

const FAQ_SYSTEM_CONTEXT = `You are an expert assistant for AgroChain™, Banimal Loop™, and FAA.zone ecosystem. Answer this question precisely and concisely. If the question is not related to these topics, politely state you can only answer questions about AgroChain™, Banimal Loop™, or FAA.zone.

Context:
- AgroChain™ is a powerful FAA.zone™ framework for Agriculture & Biotech with advanced automation and data management
- Banimal Loop™ focuses on ethical impact, creature data synthesis, and Baobab Network integration
- FAA.zone™ provides decentralized data integrity, secure orchestration, and compliance infrastructure
- VaultMesh™ powers the core FAA.zone™ infrastructure`;

async function answerWithGrok(apiKey: string, question: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        { role: 'system', content: FAQ_SYSTEM_CONTEXT },
        { role: 'user', content: `User's question: "${question}"\n\nAnswer:` },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API ${response.status}: ${text}`);
  }
  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

// Generate AI FAQ answer — prefers Grok (XAI_API_KEY) then falls back to Gemini
ai.post('/faq', async (c) => {
  try {
    const { question } = await c.req.json();

    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Question is required' }, 400);
    }

    // Prefer Grok when XAI_API_KEY is configured
    if (c.env.XAI_API_KEY) {
      const answer = await answerWithGrok(c.env.XAI_API_KEY, question);
      return c.json({ answer, provider: 'grok' });
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'No AI provider configured (XAI_API_KEY or GEMINI_API_KEY required)' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey });

    const fullPrompt = `${FAQ_SYSTEM_CONTEXT}\n\nUser's question: "${question}"\n\nAnswer:`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return c.json({ answer: response.text, provider: 'gemini' });
  } catch (error) {
    console.error('AI FAQ error:', error);
    return c.json({
      error: 'Failed to generate answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Stream AI response — Grok (SSE via streaming fetch) or Gemini native stream
ai.post('/faq-stream', async (c) => {
  try {
    const { question } = await c.req.json();

    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Question is required' }, 400);
    }

    // Grok streaming path
    if (c.env.XAI_API_KEY) {
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.env.XAI_API_KEY}` },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [
            { role: 'system', content: FAQ_SYSTEM_CONTEXT },
            { role: 'user', content: `Question: "${question}"\n\nAnswer:` },
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: true,
        }),
      });

      if (!grokResponse.ok || !grokResponse.body) {
        const text = await grokResponse.text();
        return c.json({ error: `Grok streaming error: ${text}` }, 500);
      }

      const decoder = new TextDecoder();
      return new Response(
        new ReadableStream({
          async start(controller) {
            const reader = grokResponse.body!.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const lines = decoder.decode(value).split('\n');
                for (const line of lines) {
                  if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
                  try {
                    const chunk = JSON.parse(line.slice(6)) as { choices: Array<{ delta: { content?: string } }> };
                    const text = chunk.choices[0]?.delta?.content;
                    if (text) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
                  } catch { /* skip malformed SSE lines */ }
                }
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        }),
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } }
      );
    }

    // Gemini streaming path
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'No AI provider configured (XAI_API_KEY or GEMINI_API_KEY required)' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey });

    const fullPrompt = `${FAQ_SYSTEM_CONTEXT}\n\nQuestion: "${question}"\n\nAnswer:`;

    const stream = await genai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  } catch (error) {
    console.error('AI streaming error:', error);
    return c.json({
      error: 'Failed to stream answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default ai;
