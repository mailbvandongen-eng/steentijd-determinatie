export interface Env {
  ANTHROPIC_API_KEY: string;
  RATE_LIMIT: KVNamespace;
  DAILY_LIMIT: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `${clientIP}:${today}`;

    // Check rate limit
    const currentCount = parseInt(await env.RATE_LIMIT.get(rateLimitKey) || '0');
    const dailyLimit = parseInt(env.DAILY_LIMIT || '10');

    if (currentCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Daglimiet bereikt (${dailyLimit} analyses per dag). Probeer morgen opnieuw.`
          }
        }),
        {
          status: 429,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Check if API key is configured
      if (!env.ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: { message: 'API key niet geconfigureerd. Neem contact op met de beheerder.' } }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Get request body
      const body = await request.json();

      // Forward to Anthropic API
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const result = await anthropicResponse.json();

      // Only count successful requests
      if (anthropicResponse.ok) {
        await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
          expirationTtl: 86400, // 24 hours
        });
      }

      return new Response(JSON.stringify(result), {
        status: anthropicResponse.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: { message: 'Server error' } }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};
