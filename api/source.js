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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response('API key not configured', { status: 500 });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a UK trade supplier sourcing assistant. Return ONLY valid JSON, no markdown, no preamble.
Return this exact structure:
{
  "results": [
    {
      "title": "Product name and spec",
      "source": "Supplier (Screwfix/Toolstation/Travis Perkins/B&Q/Amazon/HSS Hire)",
      "snippet": "Brief description with key specs",
      "price": "£X.XX per unit/pack/m²",
      "link": "https://www.screwfix.com",
      "delivery": "Next day delivery"
    }
  ],
  "analysis": {
    "summary": "1-2 sentence market overview for this item in the UK",
    "topPick": "Best value option and why",
    "tips": ["Practical buying tip 1", "Practical buying tip 2", "Practical buying tip 3"]
  }
}
Include 5-7 results from real UK trade suppliers with realistic 2025 UK prices.`,
      messages: [{ role: 'user', content: `Find UK suppliers for: ${query}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
