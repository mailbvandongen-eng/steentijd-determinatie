export interface Env {
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
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

    // Get URL path to determine action
    const url = new URL(request.url);
    const isSketchRequest = url.pathname === '/sketch';

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
      // Route to appropriate handler
      if (isSketchRequest) {
        return await handleSketchRequest(request, env, rateLimitKey, currentCount);
      } else {
        return await handleAnalysisRequest(request, env, rateLimitKey, currentCount);
      }
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

// Handle Claude analysis requests (existing functionality)
async function handleAnalysisRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'API key niet geconfigureerd. Neem contact op met de beheerder.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();

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

  if (anthropicResponse.ok) {
    await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
      expirationTtl: 86400,
    });
  }

  return new Response(JSON.stringify(result), {
    status: anthropicResponse.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Handle OpenAI sketch generation requests
async function handleSketchRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'OpenAI API key niet geconfigureerd.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json() as { imageBase64: string };
  const { imageBase64 } = body;

  if (!imageBase64) {
    return new Response(
      JSON.stringify({ error: { message: 'Geen afbeelding meegegeven.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Step 1: Use GPT-4o-mini to analyze the image and create a detailed description
  const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `Beschrijf dit stenen artefact in detail voor een wetenschappelijke archeologische tekening.
Focus op:
- Exacte vorm en contouren
- Bewerkingssporen en afslagpatronen
- Textuur en oppervlaktekenmerken
- Randen en snijvlakken

Geef een beknopte maar gedetailleerde beschrijving (max 100 woorden) die een tekenaar zou gebruiken om een nauwkeurige archeologische illustratie te maken. Beschrijf ALLEEN het artefact, niet de hand of achtergrond.`,
            },
          ],
        },
      ],
    }),
  });

  if (!visionResponse.ok) {
    const error = await visionResponse.json();
    return new Response(
      JSON.stringify({ error: { message: 'Fout bij analyseren afbeelding', details: error } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const visionResult = await visionResponse.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const description = visionResult.choices?.[0]?.message?.content || '';

  // Step 2: Generate archaeological sketch with DALL-E 3
  const dallePrompt = `A professional archaeological illustration of a stone artifact: ${description}

Style: Scientific archaeological pencil drawing on white background. Black and white with detailed shading showing flake scars, knapping patterns, and surface texture. Clean precise lines typical of archaeological publications. No hands, no background objects. The artifact should be centered and shown from one angle with careful attention to depicting worked edges and removal patterns. Museum-quality scientific illustration style.`;

  const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  if (!dalleResponse.ok) {
    const error = await dalleResponse.json();
    return new Response(
      JSON.stringify({ error: { message: 'Fout bij genereren tekening', details: error } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const dalleResult = await dalleResponse.json() as {
    data: Array<{ b64_json: string }>;
  };
  const sketchBase64 = dalleResult.data?.[0]?.b64_json;

  if (!sketchBase64) {
    return new Response(
      JSON.stringify({ error: { message: 'Geen tekening ontvangen van API.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Count this request
  await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
    expirationTtl: 86400,
  });

  return new Response(
    JSON.stringify({
      success: true,
      sketch: `data:image/png;base64,${sketchBase64}`,
      description: description,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}
