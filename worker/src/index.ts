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
    const isTestOpenAI = url.pathname === '/test-openai';

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
      if (isTestOpenAI) {
        return await handleTestOpenAI(env);
      } else if (isSketchRequest) {
        return await handleSketchRequest(request, env, rateLimitKey, currentCount);
      } else {
        return await handleAnalysisRequest(request, env, rateLimitKey, currentCount);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Worker error:', errorMessage, error);
      return new Response(
        JSON.stringify({ error: { message: `Server error: ${errorMessage}` } }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

// Test OpenAI connection
async function handleTestOpenAI(env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Simple completion test (no vision)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "test ok"' }],
      }),
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return new Response(
      JSON.stringify({
        ok: response.ok,
        status: response.status,
        keyLength: env.OPENAI_API_KEY.length,
        keyPrefix: env.OPENAI_API_KEY.substring(0, 7),
        response: data,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

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

// Helper function to safely parse JSON
async function safeJsonParse(response: Response, context: string): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { ok: false, error: `${context}: Lege response ontvangen (status ${response.status})` };
    }
    try {
      const data = JSON.parse(text);
      return { ok: true, data };
    } catch {
      return { ok: false, error: `${context}: Ongeldige JSON response: ${text.substring(0, 200)}` };
    }
  } catch (err) {
    return { ok: false, error: `${context}: Kon response niet lezen: ${err}` };
  }
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
      JSON.stringify({ error: { message: 'OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe als secret.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Log dat we de key hebben (niet de key zelf!)
  console.log('OpenAI key configured, length:', env.OPENAI_API_KEY.length);

  // Parse request body safely
  let imageBase64: string;
  try {
    const bodyText = await request.text();
    if (!bodyText || bodyText.trim() === '') {
      return new Response(
        JSON.stringify({ error: { message: 'Lege request body ontvangen.' } }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
    const body = JSON.parse(bodyText) as { imageBase64?: string };
    imageBase64 = body.imageBase64 || '';
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: `Ongeldige JSON in request: ${err}` } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  if (!imageBase64) {
    return new Response(
      JSON.stringify({ error: { message: 'Geen afbeelding meegegeven.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Image data received, length:', imageBase64.length, 'starts with:', imageBase64.substring(0, 30));

  // Use GPT-4o with native image generation (like ChatGPT does)
  // This allows the model to SEE the original image and generate a drawing based on it
  const imageGenResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
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
              text: `Maak van deze vuursteen een mooie archeologische tekening zoals vuurstenen artefacten worden getekend in wetenschappelijke publicaties.

Kenmerken van de tekening:
- Potloodtekening stijl met mooie arcering
- Cortex (schors) goed zichtbaar met stippen
- Afslagvlakken met parallelle lijnen
- ALLEEN de steen tekenen, NIET de hand of vingers
- Witte achtergrond
- Dezelfde vorm en oriëntatie als op de foto

Genereer de tekening.`,
            },
          ],
        },
      ],
    }),
  });

  console.log('GPT-4o response status:', imageGenResponse.status);

  if (!imageGenResponse.ok) {
    let errorText = '';
    try {
      errorText = await imageGenResponse.text();
    } catch {
      errorText = 'Could not read response';
    }
    console.log('GPT-4o error response:', errorText || '(empty)');

    let errorDetails: unknown = `HTTP ${imageGenResponse.status}`;
    if (errorText) {
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
    }

    const errorObj = errorDetails as { error?: { message?: string } };
    const errorMessage = errorObj?.error?.message || `OpenAI API error: status ${imageGenResponse.status}`;

    return new Response(
      JSON.stringify({
        error: {
          message: `Fout bij genereren tekening: ${errorMessage}`,
          details: errorDetails,
          status: imageGenResponse.status
        }
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const responseParseResult = await safeJsonParse(imageGenResponse, 'GPT-4o response');
  if (!responseParseResult.ok) {
    return new Response(
      JSON.stringify({ error: { message: responseParseResult.error } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Check if GPT-4o returned an image
  const gptResult = responseParseResult.data as {
    choices: Array<{
      message: {
        content: string | Array<{ type: string; image_url?: { url: string }; text?: string }>;
      };
    }>;
  };

  console.log('GPT-4o result:', JSON.stringify(gptResult).substring(0, 500));

  // Try to extract image from the response
  let sketchBase64: string | undefined;
  const messageContent = gptResult.choices?.[0]?.message?.content;

  if (Array.isArray(messageContent)) {
    // Multi-modal response with image
    for (const part of messageContent) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const imageUrl = part.image_url.url;
        if (imageUrl.startsWith('data:image')) {
          // Extract base64 from data URL
          const base64Match = imageUrl.match(/base64,(.+)/);
          if (base64Match) {
            sketchBase64 = base64Match[1];
          }
        }
      }
    }
  }

  // Get text description from GPT-4o response (used for DALL-E fallback and response)
  const description = typeof messageContent === 'string' ? messageContent : 'stone artifact';

  // If GPT-4o doesn't support native image generation via API, fall back to DALL-E 3
  if (!sketchBase64) {
    console.log('GPT-4o did not return an image, falling back to DALL-E 3');

    const dallePrompt = `Technical archaeological line drawing of this exact stone artifact: ${description}

STRICT REQUIREMENTS:
- ONLY the stone artifact, nothing else
- NO hands, NO fingers, NO human body parts
- White background
- Black and white pencil drawing style
- Cross-hatching for shading
- Stippling for cortex texture
- Museum-quality scientific illustration`;

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
      const errorText = await dalleResponse.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: { message: 'Fout bij genereren tekening', details: errorText } }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const dalleResult = await dalleResponse.json() as { data: Array<{ b64_json: string }> };
    sketchBase64 = dalleResult.data?.[0]?.b64_json;
  }

  console.log('Sketch received, base64 length:', sketchBase64?.length || 0);

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
