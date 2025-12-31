import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Env } from '../types';

const ai = new Hono<{ Bindings: Env }>();

// Generate AI FAQ answer
ai.post('/faq', async (c) => {
  try {
    const { question } = await c.req.json();

    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Question is required' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'GEMINI_API_KEY not configured' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey });

    const fullPrompt = `You are an expert assistant for AgroChain™, Banimal Loop™, and FAA.zone ecosystem. Answer this question precisely and concisely. If the question is not related to these topics, politely state you can only answer questions about AgroChain™, Banimal Loop™, or FAA.zone.

User's question: "${question}"

Context:
- AgroChain™ is a powerful FAA.zone™ framework for Agriculture & Biotech with advanced automation and data management
- Banimal Loop™ focuses on ethical impact, creature data synthesis, and Baobab Network integration
- FAA.zone™ provides decentralized data integrity, secure orchestration, and compliance infrastructure
- VaultMesh™ powers the core FAA.zone™ infrastructure

Answer:`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return c.json({ answer: response.text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return c.json({ 
      error: 'Failed to generate answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Stream AI response
ai.post('/faq-stream', async (c) => {
  try {
    const { question } = await c.req.json();

    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Question is required' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'GEMINI_API_KEY not configured' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey });

    const fullPrompt = `You are an expert assistant for AgroChain™, Banimal Loop™, and FAA.zone. Answer concisely.

Question: "${question}"

Answer:`;

    const stream = await genai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    // Set up streaming response
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
    console.error('Gemini streaming error:', error);
    return c.json({ 
      error: 'Failed to stream answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default ai;
