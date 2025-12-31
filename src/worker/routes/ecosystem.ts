import { Hono } from "hono";
import { sectorList, sectorData } from "../data/sectors";
import type { Env } from "../types";

const ecosystem = new Hono<{ Bindings: Env }>();

// Get all sectors list
ecosystem.get("/sectors", (c) => {
  const sectors = Object.entries(sectorList)
    .filter(([key]) => key !== "admin-panel")
    .map(([key, displayName]) => ({
      key,
      displayName,
      ...sectorData[key],
    }));

  return c.json(sectors);
});

// Get specific sector details
ecosystem.get("/sectors/:sectorKey", (c) => {
  const sectorKey = c.req.param("sectorKey");

  if (!sectorData[sectorKey]) {
    return c.json({ error: "Sector not found" }, 404);
  }

  return c.json({
    key: sectorKey,
    displayName: sectorList[sectorKey],
    ...sectorData[sectorKey],
  });
});

// Generate AI insights using Gemini API
ecosystem.post("/ai-insight", async (c) => {
  try {
    const { prompt } = await c.req.json();

    if (!prompt) {
      return c.json({ error: "Prompt is required" }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return c.json({ text: result.candidates[0].content.parts[0].text });
    } else {
      return c.json({ error: "Unexpected API response structure" }, 500);
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return c.json({ error: "Failed to generate AI insights" }, 500);
  }
});

export default ecosystem;
