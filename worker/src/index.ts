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

  // Use gpt-image-1 with correct input structure (like ChatGPT suggested)
  // Extract pure base64 without data URL prefix
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `Create a scientific archaeological pencil drawing based strictly on this photograph.

OBJECT:
- Single flint fragment.
- Maintain the exact outline and proportions from the photo.
- Same orientation as the reference image.
- Do not redesign, idealize, or improve the object.
- DO NOT include hands, fingers, or any human body parts.

STYLE:
- Black and white pencil illustration.
- Scientific archaeological drawing style (publication standard).
- Orthographic view (no perspective exaggeration).
- No artistic or dramatic effects.

SURFACE TREATMENT:
- Cortex rendered using fine stippling (dot shading).
- Flake scars rendered using light directional hatching.
- Fresh flint surfaces lighter than cortex.
- Follow actual flake scar directions visible in the photo.
- Do not invent additional knapping patterns.
- Do not exaggerate texture depth.

BACKGROUND:
- Plain white background.
- No shadow beneath object.
- No artistic lighting.

IMPORTANT:
- Use the photo as strict visual reference.
- Accuracy over aesthetics.`;

  console.log('=== IMAGE GENERATION DEBUG ===');
  console.log('Base64 length:', pureBase64.length);
  console.log('Base64 starts with:', pureBase64.substring(0, 50));

  // Try the correct gpt-image-1 structure with input array
  const requestBody = {
    model: 'gpt-image-1',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
          },
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      },
    ],
    n: 1,
    size: '1024x1024',
  };

  console.log('Request body structure:', JSON.stringify({
    model: requestBody.model,
    input_length: requestBody.input.length,
    content_types: requestBody.input[0].content.map((c: {type: string}) => c.type),
  }));

  const imageGenResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('gpt-image-1 response status:', imageGenResponse.status);

  let sketchBase64: string | undefined;
  const description = 'archaeological stone artifact';

  if (!imageGenResponse.ok) {
    let errorText = '';
    try {
      errorText = await imageGenResponse.text();
    } catch {
      errorText = 'Could not read response';
    }
    console.log('gpt-image-1 error response:', errorText || '(empty)');

    // Parse error to check what went wrong
    let errorDetails: unknown;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    const errorObj = errorDetails as { error?: { message?: string; code?: string } };
    console.log('Error details:', JSON.stringify(errorObj));

    // NO FALLBACK - return the actual error so we can debug
    return new Response(
      JSON.stringify({
        error: {
          message: `gpt-image-1 failed: ${errorObj?.error?.message || 'Unknown error'}`,
          details: errorObj,
          status: imageGenResponse.status,
          debug: {
            base64_length: pureBase64.length,
            model_used: 'gpt-image-1',
            fallback: false,
          }
        }
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } else {
    // gpt-image-1 succeeded - parse the response
    const responseParseResult = await safeJsonParse(imageGenResponse, 'gpt-image-1 response');
    if (!responseParseResult.ok) {
      return new Response(
        JSON.stringify({ error: { message: responseParseResult.error } }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const imageResult = responseParseResult.data as {
      data: Array<{ b64_json?: string; url?: string }>;
    };

    console.log('gpt-image-1 result keys:', Object.keys(imageResult));

    // Extract base64 from response
    const imageData = imageResult.data?.[0];
    if (imageData?.b64_json) {
      sketchBase64 = imageData.b64_json;
    } else if (imageData?.url) {
      // If URL returned, fetch and convert to base64
      console.log('Got URL instead of b64, fetching...');
      try {
        const imgResponse = await fetch(imageData.url);
        const imgBuffer = await imgResponse.arrayBuffer();
        sketchBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
      } catch (e) {
        console.log('Failed to fetch image URL:', e);
      }
    }
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
