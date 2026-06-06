export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { query } = await req.json();
  if (!query) return new Response('Missing query', { status: 400 });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    let searchResults = null;

    // Try Serper.dev for real search results if key available
    if (serperKey) {
      const serperRes = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${query} UK buy price`,
          gl: 'uk',
          hl: 'en',
          num: 10,
        }),
      });

      if (serperRes.ok) {
        const data = await serperRes.json();
        searchResults = data;
      }

      // Also get organic results for more context
      const organicRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${query} site:screwfix.com OR site:toolstation.com OR site:travisperkins.co.uk OR site:wickes.co.uk OR site:buildbase.co.uk buy price UK`,
          gl: 'uk',
          hl: 'en',
          num: 8,
        }),
      });

      if (organicRes.ok) {
        const organicData = await organicRes.json();
        searchResults = { ...searchResults, organic: organicData.organic };
      }
    }

    // Use Claude to process search results (or generate realistic data if no search)
    const systemPrompt = searchResults
      ? `You are a UK trade supplier sourcing assistant. You have been given real search results for "${query}". 
Extract and format the information into structured JSON. Use the ACTUAL URLs from the search results.
Return ONLY valid JSON, no markdown, no preamble.

Return this exact structure:
{
  "results": [
    {
      "title": "Exact product name from search",
      "source": "Supplier name (Screwfix/Toolstation/Travis Perkins/Wickes/Amazon etc)",
      "snippet": "Product description with key specs",
      "price": "£X.XX per unit/pack/m",
      "link": "ACTUAL URL from search results - must be a real working URL",
      "delivery": "Delivery info if available, or 'Check website for delivery'"
    }
  ],
  "analysis": {
    "summary": "Brief market overview based on the search results",
    "topPick": "Best value option with specific reason",
    "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"]
  }
}

IMPORTANT: Use real URLs from the search data. Do not make up URLs.`
      : `You are a UK trade supplier sourcing assistant. Return ONLY valid JSON, no markdown, no preamble.
For the query "${query}", provide results from real UK trade suppliers with accurate typical 2025 UK market prices.
Use real website URLs like https://www.screwfix.com/search?term=${encodeURIComponent(query)}, https://www.toolstation.com/search?q=${encodeURIComponent(query)}, https://www.travisperkins.co.uk/search/${encodeURIComponent(query)}, etc.

Return this exact structure:
{
  "results": [
    {
      "title": "Product name and spec",
      "source": "Supplier name",
      "snippet": "Description with key specs",
      "price": "£X.XX per unit/pack/m",
      "link": "Real search URL for this supplier",
      "delivery": "Typical delivery info"
    }
  ],
  "analysis": {
    "summary": "Market overview",
    "topPick": "Best value recommendation",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
}
Include 6-8 results. Use real supplier search URLs so clicking them actually finds the product.`;

    const userMessage = searchResults
      ? `Search results for "${query}":\n${JSON.stringify(searchResults, null, 2)}\n\nExtract and format these into the required JSON structure with REAL URLs from the results.`
      : `Find UK trade suppliers for: ${query}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return new Response(err, {
        status: claudeRes.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const claudeData = await claudeRes.json();
    return new Response(JSON.stringify(claudeData), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
